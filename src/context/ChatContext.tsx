import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ChatState, Conversation, Message } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  state: ChatState;
  createNewConversation: () => string;
  switchConversation: (id: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>, conversationId?: string) => void;
  updateLastMessage: (content: string, conversationId?: string) => void;
  editMessage: (messageId: string, newContent: string, conversationId?: string) => void;
  deleteMessage: (messageId: string, conversationId?: string) => void;
  addReaction: (messageId: string, reaction: string, conversationId?: string) => void;
  deleteConversation: (id: string) => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
}

type ChatAction =
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'SWITCH_CONVERSATION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: { conversationId: string; content: string } }
  | { type: 'EDIT_MESSAGE'; payload: { conversationId: string; messageId: string; content: string } }
  | { type: 'DELETE_MESSAGE'; payload: { conversationId: string; messageId: string } }
  | { type: 'ADD_REACTION'; payload: { conversationId: string; messageId: string; reaction: string } }
  | { type: 'UPDATE_CONVERSATION_TITLE'; payload: { conversationId: string; title: string } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<ChatState> };

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  theme: 'light',
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'CREATE_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        currentConversationId: action.payload.id,
      };

    case 'SWITCH_CONVERSATION':
      return {
        ...state,
        currentConversationId: action.payload,
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: [...conv.messages, action.payload.message],
                updatedAt: new Date(),
              }
            : conv
        ),
      };

    case 'UPDATE_LAST_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: conv.messages.map((msg, index) =>
                  index === conv.messages.length - 1
                    ? { ...msg, content: action.payload.content, isTyping: false }
                    : msg
                ),
                updatedAt: new Date(),
              }
            : conv
        ),
      };

    case 'EDIT_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === action.payload.messageId
                    ? { ...msg, content: action.payload.content, edited: true }
                    : msg
                ),
                updatedAt: new Date(),
              }
            : conv
        ),
      };

    case 'DELETE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: conv.messages.filter(msg => msg.id !== action.payload.messageId),
                updatedAt: new Date(),
              }
            : conv
        ),
      };

    case 'ADD_REACTION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === action.payload.messageId
                    ? { 
                        ...msg, 
                        reactions: msg.reactions 
                          ? [...msg.reactions, action.payload.reaction]
                          : [action.payload.reaction]
                      }
                    : msg
                ),
                updatedAt: new Date(),
              }
            : conv
        ),
      };

    case 'UPDATE_CONVERSATION_TITLE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? { ...conv, title: action.payload.title, updatedAt: new Date() }
            : conv
        ),
      };

    case 'DELETE_CONVERSATION':
      const filteredConversations = state.conversations.filter(
        conv => conv.id !== action.payload
      );
      return {
        ...state,
        conversations: filteredConversations,
        currentConversationId:
          state.currentConversationId === action.payload
            ? filteredConversations[0]?.id || null
            : state.currentConversationId,
      };

    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('nagregpt-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Convert date strings back to Date objects
        const processedState = {
          ...parsedState,
          conversations: parsedState.conversations?.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages?.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          })) || [],
        };
        dispatch({ type: 'LOAD_STATE', payload: processedState });
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nagregpt-state', JSON.stringify(state));
  }, [state]);

  // Apply theme to document
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const createNewConversation = (): string => {
    const id = uuidv4();
    const newConversation: Conversation = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'CREATE_CONVERSATION', payload: newConversation });
    return id;
  };

  const switchConversation = (id: string) => {
    dispatch({ type: 'SWITCH_CONVERSATION', payload: id });
  };

  const addMessage = (messageData: Omit<Message, 'id' | 'timestamp'>, conversationId?: string) => {
    const targetConversationId = conversationId || state.currentConversationId;
    if (!targetConversationId) return;

    const message: Message = {
      ...messageData,
      id: uuidv4(),
      timestamp: new Date(),
    };

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { conversationId: targetConversationId, message },
    });

    // Update conversation title if it's the first user message
    const currentConv = state.conversations.find(c => c.id === targetConversationId);
    if (currentConv && currentConv.messages.length === 0 && messageData.role === 'user') {
      const title = messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '');
      setTimeout(() => {
        dispatch({
          type: 'UPDATE_CONVERSATION_TITLE',
          payload: { conversationId: targetConversationId, title }
        });
      }, 0);
    }
  };

  const updateLastMessage = (content: string, conversationId?: string) => {
    const targetConversationId = conversationId || state.currentConversationId;
    if (!targetConversationId) return;
    
    console.log('🔄 Updating last message in conversation:', targetConversationId);
    console.log('📝 New content:', content.substring(0, 100) + '...');
    
    dispatch({
      type: 'UPDATE_LAST_MESSAGE',
      payload: { conversationId: targetConversationId, content },
    });
  };

  const deleteConversation = (id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const editMessage = (messageId: string, newContent: string, conversationId?: string) => {
    const targetConversationId = conversationId || state.currentConversationId;
    if (!targetConversationId) return;
    
    dispatch({
      type: 'EDIT_MESSAGE',
      payload: { conversationId: targetConversationId, messageId, content: newContent },
    });
  };

  const deleteMessage = (messageId: string, conversationId?: string) => {
    const targetConversationId = conversationId || state.currentConversationId;
    if (!targetConversationId) return;
    
    dispatch({
      type: 'DELETE_MESSAGE',
      payload: { conversationId: targetConversationId, messageId },
    });
  };

  const addReaction = (messageId: string, reaction: string, conversationId?: string) => {
    const targetConversationId = conversationId || state.currentConversationId;
    if (!targetConversationId) return;
    
    dispatch({
      type: 'ADD_REACTION',
      payload: { conversationId: targetConversationId, messageId, reaction },
    });
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        createNewConversation,
        switchConversation,
        addMessage,
        updateLastMessage,
        editMessage,
        deleteMessage,
        addReaction,
        deleteConversation,
        toggleTheme,
        setLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
