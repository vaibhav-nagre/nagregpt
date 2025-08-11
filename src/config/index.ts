// Environment configuration
export const config = {
  // Groq API configuration
  groq: {
    apiKey: import.meta.env.VITE_GROQ_API_KEY || 'YOUR_GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: {
      default: 'llama-3.1-8b-instant',
      fast: 'llama-3.1-8b-instant',
      smart: 'llama-3.1-70b-versatile',
      coding: 'llama-3.1-8b-instant',
    }
  },
  
  // App configuration
  app: {
    name: 'NagreGPT',
    version: '1.0.0',
    maxMessageLength: 4000,
    maxConversations: 100,
  },

  // Storage configuration
  storage: {
    key: 'nagregpt-state',
    version: '1.0',
  },

  // Feature flags
  features: {
    fileUpload: true,
    voiceInput: true,
    imageGeneration: false,
    webBrowsing: false,
    plugins: false,
  }
};

// Validation
export const validateConfig = () => {
  const warnings: string[] = [];
  
  if (config.groq.apiKey === 'YOUR_GROQ_API_KEY') {
    warnings.push('Groq API key not configured. Please set VITE_GROQ_API_KEY environment variable.');
  }
  
  return warnings;
};
