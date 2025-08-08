import { useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import Chat from './components/Chat';
import Header from './components/Header';

function AppContent() {
  const { state } = useChat();

  useEffect(() => {
    // Apply theme class to document element
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gpt-gray-900 dark:to-gpt-gray-800 animate-fade-in">
      {/* Header */}
      <Header />
      
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Chat />
      </main>
    </div>
  );
}

function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}

export default App;
