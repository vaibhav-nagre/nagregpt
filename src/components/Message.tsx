import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ClipboardIcon, 
  CheckIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useChat } from '../context/ChatContext';
import type { Message } from '../types';
import SecurityIndicator from './SecurityIndicator';
import photoJpg from '/photo.jpg';

interface MessageProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  isStreaming?: boolean;
}

export default function MessageComponent({ 
  message, 
  onRegenerate, 
  onEdit, 
  onDelete, 
  isStreaming = false
}: MessageProps) {
  const { state } = useChat();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  const isUser = message.role === 'user';
  const isDark = state.theme === 'dark';

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

    if (inline) {
      return (
        <code 
          className="bg-gray-100 dark:bg-gpt-gray-700 text-red-500 dark:text-red-400 px-1 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gpt-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-sm rounded-t-md border-b border-gray-200 dark:border-gpt-gray-600">
          <span className="font-medium">{language || 'code'}</span>
          <button
            onClick={() => copyToClipboard(codeString, codeId)}
            className="flex items-center space-x-1 hover:bg-gray-200 dark:hover:bg-gpt-gray-600 px-2 py-1 rounded transition-colors"
          >
            {copiedCode === codeId ? (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          style={isDark ? oneDark : oneLight}
          language={language}
          PreTag="div"
          className="!mt-0 !rounded-t-none !bg-white dark:!bg-gpt-gray-800"
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className={`message-fade-in group w-full ${isUser ? 'bg-transparent' : 'bg-transparent'} animate-slide-in-up`}>
      <div className="max-w-3xl mx-auto px-2 sm:px-3 py-0.5 sm:py-1">
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`
            max-w-[90%] sm:max-w-2xl p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1
            ${isUser 
              ? 'bg-cyan-50/80 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-100 border border-cyan-200/60 dark:border-cyan-700/50 backdrop-blur-sm' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
            }
          `}>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <div className="flex items-center space-x-1">
                  {isUser && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center overflow-hidden border-2 border-cyan-300/60 dark:border-cyan-600/50 flex-shrink-0 bg-cyan-100/70 dark:bg-cyan-800/40 backdrop-blur-sm">
                      <img 
                        src={photoJpg} 
                        alt="Vaibhav" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<span class="text-cyan-600 dark:text-cyan-300 text-xs font-bold">V</span>';
                        }}
                      />
                    </div>
                  )}
                  {!isUser && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center bg-gray-600 dark:bg-gray-500 text-white font-medium text-xs flex-shrink-0">
                      <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  )}
                  <span className={`font-medium text-xs ${isUser ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {isUser ? 'Vaibhav' : 'NagreGPT'}
                  </span>
                </div>
                
                
                {message.timestamp && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                    {formatTimestamp(message.timestamp.getTime())}
                  </span>
                )}
              </div>
              
              {/* Security Indicator for assistant messages */}
              {!isUser && message.metadata && (
                <div className="mb-1">
                  <SecurityIndicator 
                    isSecure={!message.metadata.securityBlocked}
                    riskScore={message.metadata.riskScore || 0}
                    threatCount={message.metadata.threatCount || 0}
                    className="text-xs"
                  />
                </div>
              )}
              
              {isEditing ? (
                <div className="mb-1 sm:mb-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={handleEdit}
                      className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(message.content);
                      }}
                      className="px-2 sm:px-3 py-1 bg-gray-500 text-white rounded-lg text-xs sm:text-sm hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`prose prose-sm max-w-none ${isUser ? 'prose-cyan dark:prose-invert' : 'prose-gray dark:prose-invert'} ${isStreaming ? 'streaming-text typewriter-cursor' : ''}`}>
                  <ReactMarkdown
                    components={{
                      code: CodeBlock,
                      pre: ({ children }) => <>{children}</>,
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`${isUser ? 'text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300' : 'text-gpt-blue-500 hover:text-gpt-blue-600 dark:text-gpt-blue-400 dark:hover:text-gpt-blue-300'} underline font-medium`}
                        >
                          {children}
                        </a>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-semibold mt-5 mb-3 text-gray-900 dark:text-gray-100">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-md font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 sm:mb-3 leading-relaxed text-gray-700 dark:text-gray-300 text-sm">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2 sm:mb-3 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-2 sm:mb-3 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="ml-4 leading-relaxed">
                          {children}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gpt-blue-500 pl-3 py-1 sm:py-2 my-2 sm:my-3 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg italic text-gray-600 dark:text-gray-400 text-sm">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-gray-100">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-gray-800 dark:text-gray-200">
                          {children}
                        </em>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2 sm:my-3">
                          <table className="min-w-full border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {children}
                        </tbody>
                      ),
                      th: ({ children }) => (
                        <th className="px-2 sm:px-3 py-1 sm:py-2 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-gray-700 dark:text-gray-300 text-sm">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              
              <div className="flex items-center justify-between mt-0.5 sm:mt-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1">
                  
                  {isUser && !message.isTyping && (
                    <>
                      <button
                        onClick={() => onDelete?.(message.id)}
                        className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 px-1 py-0.5 sm:py-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </>
                  )}
                  
                  
                  {!isUser && !message.isTyping && onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-1 py-0.5 sm:py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ArrowPathIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Regenerate</span>
                    </button>
                  )}
                </div>

                
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {copiedCode === message.id ? (
                    <>
                      <CheckIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
