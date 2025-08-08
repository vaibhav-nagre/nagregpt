import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ChatProvider, useChat } from './context/ChatContext';
import Chat from './components/Chat';
import Header from './components/Header';

function AppContent() {
  const { state, createNewConversation } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Apply theme class to document element
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  // Handle home navigation
  const handleHomeClick = () => {
    // Create a new conversation and navigate to home
    createNewConversation();
    navigate('/', { replace: true });
  };

  // Auto-navigate to a conversation route if we have an active conversation but are on root
  useEffect(() => {
    if (location.pathname === '/' && state.currentConversationId) {
      navigate(`/chat/${state.currentConversationId}`, { replace: true });
    }
  }, [state.currentConversationId, location.pathname, navigate]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gpt-gray-900 dark:to-gpt-gray-800 animate-fade-in">
      {/* Header */}
      <Header onHomeClick={handleHomeClick} />
      
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router basename="/nagregpt">
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </Router>
  );
}

export default App;
