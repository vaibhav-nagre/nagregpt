import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import MessageComponent from './Message';
import EnhancedChatInput from './EnhancedChatInput';
import { groqAPI, convertToGroqMessages } from '../services/groqAPI';
import { FileProcessor } from '../utils/fileProcessor';
import type { FileAnalysis } from '../utils/fileProcessor';
import logoSvg from '/logo.svg';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { state, addMessage, updateLastMessage, setLoading, createNewConversation, switchConversation, clearCurrentConversation, editMessage, deleteMessage, addReaction } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const redirectingRef = useRef(false);

  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const getScreenSize = () => {
    const width = window.innerWidth;
    if (width < 480) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    return 'lg';
  };

  useEffect(() => {
    if (conversationId) {
      redirectingRef.current = false; // Reset redirect flag when we have a conversationId
      const conversationExists = state.conversations.some(conv => conv.id === conversationId);
      if (conversationExists) {
        if (state.currentConversationId !== conversationId) {
          switchConversation(conversationId);
        }
      } else {
        navigate('/', { replace: true });
      }
    } else {
      // Only redirect mobile users to new chat if they're on the home page and don't have any conversation
      if (isMobile() && !state.currentConversationId && window.location.pathname === '/' && !redirectingRef.current) {
        redirectingRef.current = true; // Set flag to prevent multiple redirects
        const newConversationId = createNewConversation();
        navigate(`/chat/${newConversationId}`, { replace: true });
        return;
      }
      
      // Clear current conversation only if we're on the home page
      if (state.currentConversationId && window.location.pathname === '/') {
        clearCurrentConversation();
      }
    }
  }, [conversationId, state.conversations, state.currentConversationId, switchConversation, clearCurrentConversation, navigate, createNewConversation]);

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
    
    let conversationId = state.currentConversationId;
    if (!conversationId) {
      conversationId = createNewConversation();
      console.log('📝 Created new conversation:', conversationId);
      navigate(`/chat/${conversationId}`, { replace: true });
    }

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

        processedContent = FileProcessor.createFileAnalysisPrompt(content, fileAnalyses);
        console.log('✅ Files processed successfully');
        console.log('📝 Enhanced prompt length:', processedContent.length);
      } catch (error) {
        console.error('❌ Error processing files:', error);
        processedContent = `${content}\n\n[Note: Error processing attached files. Please describe the files manually.]`;
      }
    }

    addMessage({ content, role: 'user', files }, conversationId);
    console.log('✅ Added user message');

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
      const conversationHistory = currentConversation?.messages || [];
      const historyMessages = conversationHistory
        .filter(msg => !msg.isTyping)
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      const allMessages = [
        ...historyMessages,
        { role: 'user' as const, content: processedContent }
      ];
      
      const messages = convertToGroqMessages(allMessages);

      console.log('🔄 Calling Groq API with full conversation history');
      console.log('📝 Messages count:', messages.length);
      console.log('📝 Latest message preview:', processedContent.substring(0, 100) + '...');

      let fullResponse = '';

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
    
    const messages = [...currentConversation.messages];
    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');
    
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[lastUserMessageIndex];
    
    if (messages.length > lastUserMessageIndex + 1) {
      await handleSendMessage(lastUserMessage.content);
    }
  };

  if (!currentConversation) {
    const isMobileDevice = isMobile();
    const screenSize = getScreenSize();
    
    return (
      <div className="flex-1 flex flex-col min-h-0">
        
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto">
          <div className={`text-center mx-auto animate-fade-in-up w-full ${
            screenSize === 'xs' ? 'max-w-xs px-2' : 
            screenSize === 'sm' ? 'max-w-sm px-4' : 
            isMobileDevice ? 'max-w-md px-6' : 'max-w-2xl'
          }`}>
            
            {/* Logo and Brand */}
            <div className="relative mb-4 sm:mb-6 md:mb-8 animate-bounce-in">
              <img 
                src={logoSvg} 
                alt="NagreGPT Logo" 
                className={`${
                  screenSize === 'xs' ? 'w-16 h-16' :
                  screenSize === 'sm' ? 'w-20 h-20' :
                  isMobileDevice ? 'w-24 h-24' : 'w-32 h-32'
                } mx-auto rounded-2xl shadow-xl animate-glow`}
              />
              <div className={`absolute -top-1 sm:-top-2 -right-1 sm:-right-2 ${
                isMobileDevice ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-6 h-6'
              } bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse`}></div>
              <div className={`absolute -bottom-1 sm:-bottom-2 -left-1 sm:-left-2 ${
                isMobileDevice ? 'w-2 h-2 sm:w-3 sm:h-3' : 'w-4 h-4'
              } bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse`} style={{ animationDelay: '0.5s' }}></div>
            </div>

            <h1 className={`${
              screenSize === 'xs' ? 'text-xl' :
              screenSize === 'sm' ? 'text-2xl' :
              isMobileDevice ? 'text-2xl sm:text-3xl' : 'text-4xl'
            } font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 md:mb-4 animate-slide-in-left leading-tight`}>
              Welcome to{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                NagreGPT
              </span>
            </h1>
            
            <p className={`${
              screenSize === 'xs' ? 'text-sm mb-4' :
              screenSize === 'sm' ? 'text-base mb-5' :
              isMobileDevice ? 'text-base mb-6' : 'text-xl mb-12'
            } text-gray-600 dark:text-gray-400 animate-slide-in-right leading-relaxed`}>
              Your AI assistant powered by{' '}
              <span className="font-semibold text-gpt-green-500">Groq's lightning-fast</span>{' '}
              Llama models. {!isMobileDevice && 'Ask anything, and let\'s start creating together! ✨'}
              {isMobileDevice && 'Start chatting! ✨'}
            </p>
            
            
            {isMobileDevice ? (
              <div className={`${screenSize === 'xs' ? 'mb-4' : 'mb-6'}`}>
                <button
                  onClick={() => {
                    if (!redirectingRef.current) {
                      redirectingRef.current = true;
                      const newConversationId = createNewConversation();
                      navigate(`/chat/${newConversationId}`, { replace: true });
                    }
                  }}
                  className={`w-full ${
                    screenSize === 'xs' ? 'px-4 py-3 text-sm' :
                    screenSize === 'sm' ? 'px-5 py-3 text-base' :
                    'px-6 py-4 text-base'
                  } bg-gradient-to-r from-gpt-green-500 to-gpt-blue-500 text-white rounded-xl font-medium hover:from-gpt-green-600 hover:to-gpt-blue-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation`}
                  style={{ minHeight: '48px' }}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Start New Chat</span>
                  </span>
                </button>
              </div>
            ) : (
              <>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { icon: '💡', title: 'Creative Writing', desc: '' },
                { icon: '🔧', title: 'Code Assistant', desc: '' },
                { icon: '📚', title: 'Learning Helper', desc: '' },
                { icon: '✨', title: 'General Chat', desc: '' },
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

                
                <div className="mb-8">
                  <button
                    onClick={() => handleSendMessage("Say hello and tell me you're working!")}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors duration-200 mr-4"
                  >
                    🧪 Test API Connection
                  </button>
                </div>

                
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
              </>
            )}
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
    <div className="flex-1 flex flex-col h-full min-h-0">
      
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 md:px-4 py-1 sm:py-2 md:py-4 space-y-1 sm:space-y-2 scroll-smooth max-w-4xl mx-auto w-full scrollbar-hide overscroll-contain">
        
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gpt-blue-500/5 to-transparent animate-gradient-shift"></div>
        </div>
        
        
        {currentConversation.messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-6 sm:py-8 md:py-12 animate-fade-in-up min-h-[50vh]">
            <div className="text-center max-w-xs sm:max-w-md mx-auto px-3 sm:px-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-gpt-green-500 to-gpt-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 shadow-lg animate-bounce-in">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 animate-slide-in-left">
                Ready to chat!
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 animate-slide-in-right leading-relaxed">
                Start typing your prompt below or upload files for analysis. 
                Ask me anything - I'm here to help! ✨
              </p>
              <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-xs sm:text-sm animate-fade-in">
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  💡 Ask questions
                </span>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  📝 Write content
                </span>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  🔍 Analyze files
                </span>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gpt-gray-700 rounded-full text-gray-600 dark:text-gray-400 whitespace-nowrap">
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
        
        
        <div ref={messagesEndRef} className="h-1" />
      </div>

      
      <EnhancedChatInput 
        onSendMessage={handleSendMessage}
        isLoading={state.isLoading}
        onStop={handleStopGeneration}
      />
    </div>
  );
}
