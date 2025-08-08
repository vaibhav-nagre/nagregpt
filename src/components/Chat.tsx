import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import MessageComponent from './Message';
import EnhancedChatInput from './EnhancedChatInput';
import { groqAPI, convertToGroqMessages } from '../services/groqAPI';
import { FileProcessor } from '../utils/fileProcessor';
import type { FileAnalysis } from '../utils/fileProcessor';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { state, addMessage, updateLastMessage, setLoading, createNewConversation, switchConversation, editMessage, deleteMessage, addReaction } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Handle URL-based conversation switching
  useEffect(() => {
    if (conversationId) {
      // Check if the conversation exists
      const conversationExists = state.conversations.some(conv => conv.id === conversationId);
      if (conversationExists) {
        // Switch to the conversation if it's not already active
        if (state.currentConversationId !== conversationId) {
          switchConversation(conversationId);
        }
      } else {
        // Conversation doesn't exist, redirect to home
        navigate('/', { replace: true });
      }
    }
    // Removed auto-navigation to conversation URLs - let users stay on home page
  }, [conversationId, state.conversations, state.currentConversationId, switchConversation, navigate]);

  const currentConversation = state.conversations.find(
    conv => conv.id === state.currentConversationId
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, currentStreamingMessage]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    console.log('🚀 Sending message:', content, 'Files:', files?.length || 0);
    
    // Create new conversation if none exists
    let conversationId = state.currentConversationId;
    if (!conversationId) {
      conversationId = createNewConversation();
      console.log('📝 Created new conversation:', conversationId);
      // Navigate to the new conversation URL only when sending a message
      navigate(`/chat/${conversationId}`, { replace: true });
    }

    // Process attached files if any
    let processedContent = content;
    if (files && files.length > 0) {
      console.log('📁 Processing attached files...');
      try {
        const fileAnalyses: FileAnalysis[] = [];
        
        for (const file of files) {
          console.log(`📄 Processing file: ${file.name}`);
          const analysis = await FileProcessor.processFile(file);
          fileAnalyses.push(analysis);
        }

        // Create enhanced prompt with file context
        processedContent = FileProcessor.createFileAnalysisPrompt(content, fileAnalyses);
        console.log('✅ Files processed successfully');
        console.log('📝 Enhanced prompt length:', processedContent.length);
      } catch (error) {
        console.error('❌ Error processing files:', error);
        processedContent = `${content}\n\n[Note: Error processing attached files. Please describe the files manually.]`;
      }
    }

    // Add user message (show original message to user, but send processed content to AI)
    addMessage({ content, role: 'user', files }, conversationId);
    console.log('✅ Added user message');

    // Add assistant message with typing indicator
    addMessage({ 
      content: '', 
      role: 'assistant',
      isTyping: true 
    }, conversationId);
    console.log('⏳ Added typing indicator');

    setLoading(true);
    setCurrentStreamingMessage('');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Build conversation history with current processed message
      const conversationHistory = currentConversation?.messages || [];
      const historyMessages = conversationHistory
        .filter(msg => !msg.isTyping) // Exclude typing indicators
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      // Add the current processed message
      const allMessages = [
        ...historyMessages,
        { role: 'user' as const, content: processedContent }
      ];
      
      const messages = convertToGroqMessages(allMessages);

      console.log('🔄 Calling Groq API with full conversation history');
      console.log('📝 Messages count:', messages.length);
      console.log('📝 Latest message preview:', processedContent.substring(0, 100) + '...');

      let fullResponse = '';

      // Stream the response
      const result = await groqAPI.sendMessage(
        messages,
        'llama-3.1-8b-instant',
        (chunk: string) => {
          console.log('📦 Received chunk:', chunk);
          if (controller.signal.aborted) return;
          
          fullResponse += chunk;
          setCurrentStreamingMessage(fullResponse);
          updateLastMessage(fullResponse, conversationId);
        }
      );

      console.log('✅ API call successful');
      console.log('📄 Final response:', result);
      console.log('📏 Response length:', result.length);

      // Final update without typing indicator
      updateLastMessage(result || fullResponse, conversationId);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        if (error.message.includes('API key')) {
          errorMessage = 'API key not configured. Please add your Groq API key to use NagreGPT.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit reached. Please wait a moment before sending another message.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      updateLastMessage(errorMessage, conversationId);
    } finally {
      setLoading(false);
      setCurrentStreamingMessage('');
      setAbortController(null);
      console.log('🔚 Message handling complete');
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      setCurrentStreamingMessage('');
      
      // Update the last message to remove typing indicator
      if (currentConversation?.messages.length) {
        const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
        if (lastMessage.isTyping) {
          updateLastMessage(currentStreamingMessage || 'Response stopped.', state.currentConversationId || undefined);
        }
      }
    }
  };

  const handleRegenerate = async () => {
    if (!currentConversation?.messages.length) return;
    
    // Find the last user message
    const messages = [...currentConversation.messages];
    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');
    
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove the last assistant message if it exists
    if (messages.length > lastUserMessageIndex + 1) {
      // We'll regenerate by sending the same user message again
      await handleSendMessage(lastUserMessage.content);
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Animated Welcome screen */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
            {/* Animated Logo */}
            <div className="relative mb-8 animate-bounce-in">
              <div className="w-24 h-24 bg-gradient-to-br from-gpt-green-500 via-gpt-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-glow">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gpt-green-500 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gpt-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 animate-slide-in-left">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-gpt-green-500 to-gpt-blue-500 bg-clip-text text-transparent">
                NagreGPT
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 animate-slide-in-right">
              Your AI assistant powered by{' '}
              <span className="font-semibold text-gpt-green-500">Groq's lightning-fast</span>{' '}
              Llama models. Ask anything, and let's start creating together! ✨
            </p>
            
            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { icon: '💡', title: 'Creative Writing', desc: 'Stories, poems, and ideas' },
                { icon: '🔧', title: 'Code Assistant', desc: 'Debug, write, and learn' },
                { icon: '📚', title: 'Learning Helper', desc: 'Explanations and tutorials' },
                { icon: '✨', title: 'General Chat', desc: 'Friendly conversations' },
              ].map((feature, index) => (
                <div 
                  key={feature.title}
                  className="p-6 rounded-2xl bg-white/80 dark:bg-gpt-gray-700/80 border border-gray-200/50 dark:border-gpt-gray-600/50 hover-lift glass animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-3xl mb-3 animate-bounce-in" style={{ animationDelay: `${index * 0.2}s` }}>
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

          

            {/* API Test Button */}
            <div className="mb-8">
              <button
                onClick={() => handleSendMessage("Say hello and tell me you're working!")}
                className="px-6 py-3 bg-gradient-to-r from-gpt-green-500 to-gpt-blue-500 text-white rounded-xl font-medium hover:from-gpt-green-600 hover:to-gpt-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl animate-glow mr-4"
              >
                🧪 Test API Connection
              </button>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span>Always Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span>Privacy Focused</span>
              </div>
            </div>
          </div>
        </div>
        
        <EnhancedChatInput 
          onSendMessage={handleSendMessage}
          isLoading={state.isLoading}
          onStop={handleStopGeneration}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages container with enhanced animations */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4 space-y-1 sm:space-y-2 scroll-smooth max-w-4xl mx-auto w-full scrollbar-hide">
        {/* Animated gradient background overlay */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gpt-blue-500/5 to-transparent animate-gradient-shift"></div>
        </div>
        
        {/* Empty state message for new chat */}
        {currentConversation.messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8 sm:py-12 animate-fade-in-up">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gpt-green-500 to-gpt-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg animate-bounce-in">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 animate-slide-in-left">
                Ready to chat!
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 animate-slide-in-right">
                Start typing your prompt below or upload files for analysis. 
                Ask me anything - I'm here to help! ✨
              </p>
              <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-xs sm:text-sm animate-fade-in">
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                  💡 Ask questions
                </span>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                  📝 Write content
                </span>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                  🔍 Analyze files
                </span>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                  💻 Code help
                </span>
              </div>
            </div>
          </div>
        )}
        
        {currentConversation.messages.map((message, index) => (
          <div
            key={message.id}
            className="animate-fade-in-up message-container"
            style={{ 
              animationDelay: `${Math.min(index * 0.1, 0.5)}s`,
              animationFillMode: 'both'
            }}
          >
            <MessageComponent 
              message={message}
              onRegenerate={message.role === 'assistant' ? handleRegenerate : undefined}
              onEdit={editMessage}
              onDelete={deleteMessage}
              onReaction={addReaction}
            />
          </div>
        ))}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input */}
      <EnhancedChatInput 
        onSendMessage={handleSendMessage}
        isLoading={state.isLoading}
        onStop={handleStopGeneration}
      />
    </div>
  );
}
