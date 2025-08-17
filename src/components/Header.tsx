import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import ModelIndicator from './ModelIndicator';
import { 
  SunIcon, 
  MoonIcon,
  PlusIcon,
  CheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { FeedbackManager } from '../utils/feedbackManager';
import logoSvg from '/logo.svg';

interface HeaderProps {
  onHomeClick?: () => void;
}

export default function Header({ onHomeClick }: HeaderProps) {
  const { state, toggleTheme, clearCurrentConversation, createNewConversation } = useChat();
  const navigate = useNavigate();
  const [showNewChatMessage, setShowNewChatMessage] = useState(false);
  const [showFeedbackTooltip, setShowFeedbackTooltip] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState({ likes: 0, dislikes: 0, loves: 0, total: 0 });

  const handleNewChat = () => {
    const newConversationId = createNewConversation();
    navigate(`/chat/${newConversationId}`, { replace: true });
    setShowNewChatMessage(true);
  };

  const handleLogoClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      clearCurrentConversation();
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    const updateStats = () => {
      const newStats = FeedbackManager.getFeedbackStats();
      setFeedbackStats(newStats);
    };
    
    updateStats();
    
    const interval = setInterval(updateStats, 2000);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nagregpt-feedback' || e.key === 'nagregpt-state') {
        updateStats();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleFeedbackUpdate = () => {
      updateStats();
    };
    
    window.addEventListener('feedback-updated', handleFeedbackUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('feedback-updated', handleFeedbackUpdate);
    };
  }, []);

  useEffect(() => {
    if (showNewChatMessage) {
      const timer = setTimeout(() => {
        setShowNewChatMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showNewChatMessage]);

  return (
    <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 border-b border-gray-200/50 dark:border-gpt-gray-600/50 bg-white/80 dark:bg-gpt-gray-800/80 backdrop-blur-md glass animate-slide-in-left">
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button 
          onClick={handleLogoClick}
          className="flex items-center space-x-2 sm:space-x-3 animate-bounce-in hover:scale-105 transition-transform duration-200 cursor-pointer focus-ring rounded-xl px-2 py-1"
          title="Go to Home"
        >
          <div className="relative">
            <img 
              src={logoSvg} 
              alt="NagreGPT Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg animate-glow"
            />
            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
            NagreGPT
          </h1>
        </button>
        
        <button
          onClick={handleNewChat}
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-gray-100 dark:bg-gpt-gray-700 hover:bg-gray-200 dark:hover:bg-gpt-gray-600 transition-all duration-200 hover-lift focus-ring btn-primary"
        >
          <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">New Chat</span>
          <span className="xs:hidden">New</span>
        </button>

        {/* AI Model Indicator */}
        <div className="hidden md:block">
          <ModelIndicator />
        </div>

        
        {showNewChatMessage && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg animate-slide-in-right">
            <CheckIcon className="w-4 h-4" />
            <span className="text-sm font-medium">New chat started!</span>
          </div>
        )}
      </div>

      
      <div className="flex items-center space-x-1 sm:space-x-3">
        
        {feedbackStats.total > 0 && (
          <div 
            className="relative hidden sm:block"
            onMouseEnter={() => setShowFeedbackTooltip(true)}
            onMouseLeave={() => setShowFeedbackTooltip(false)}
          >
            <div className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-gpt-green-500/10 to-gpt-blue-500/10 border border-gpt-green-500/20">
              <ChartBarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gpt-green-500 animate-pulse" />
              <span className="text-xs font-medium text-gpt-green-600 dark:text-gpt-green-400">
                Learning ({feedbackStats.total})
              </span>
            </div>
            
            
            {showFeedbackTooltip && (
              <div className="absolute top-full right-0 mt-2 w-48 p-3 bg-white dark:bg-gpt-gray-800 border border-gray-200 dark:border-gpt-gray-600 rounded-xl shadow-lg z-50 animate-slide-in-up">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Learning Progress</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>❤️ Excellent:</span>
                    <span>{feedbackStats.loves}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>👍 Good:</span>
                    <span>{feedbackStats.likes}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>👎 Needs Work:</span>
                    <span>{feedbackStats.dislikes}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 sm:p-3 rounded-xl bg-gray-100 dark:bg-gpt-gray-700 hover:bg-gray-200 dark:hover:bg-gpt-gray-600 transition-all duration-200 hover-lift focus-ring group"
          title={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {state.theme === 'light' ? (
            <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 group-hover:rotate-12 transition-transform duration-200" />
          ) : (
            <SunIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 group-hover:rotate-12 transition-transform duration-200" />
          )}
        </button>
      </div>
    </header>
  );
}
