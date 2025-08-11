import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ChatProvider, useChat } from './context/ChatContext';
import Chat from './components/Chat';
import Header from './components/Header';

function AppContent() {
  const { state, clearCurrentConversation } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const handleHomeClick = () => {
    clearCurrentConversation();
    navigate('/', { replace: true });
  };


  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gpt-gray-900 dark:to-gpt-gray-800 animate-fade-in mobile-viewport">
      
      <Header onHomeClick={handleHomeClick} />
      
      
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
