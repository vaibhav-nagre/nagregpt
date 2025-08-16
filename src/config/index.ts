export const config = {
  groq: {
    apiKey: import.meta.env.VITE_GROQ_API_KEY || 'YOUR_GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: {
      latest: 'llama-3.3-70b-versatile',
      experimental: 'llama-3.2-90b-vision-preview',
      premium: 'llama-3.3-70b-versatile',
      default: 'llama-3.3-70b-versatile',
      fast: 'llama-3.1-8b-instant',
    }
  },

  deepseek: {
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
    baseUrl: 'https://api.deepseek.com/v1',
    models: {
      latest: 'deepseek-chat',
      coder: 'deepseek-coder',
      reasoning: 'deepseek-reasoner',
    }
  },

  openrouter: {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: {
      latest: 'meta-llama/llama-3.2-90b-vision-instruct',
      qwen: 'qwen/qwen-2.5-72b-instruct',
      claude: 'anthropic/claude-3.5-sonnet',
      gpt4: 'openai/gpt-4o-mini',
    }
  },

  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: {
      latest: 'gemini-2.0-flash-exp',
      stable: 'gemini-1.5-pro-latest',
      flash: 'gemini-1.5-flash-latest',
    }
  },
  
  app: {
    name: 'NagreGPT',
    version: '1.0.0',
    maxMessageLength: 4000,
    maxConversations: 100,
  },

  storage: {
    key: 'nagregpt-state',
    version: '1.0',
  },

  features: {
    fileUpload: true,
    voiceInput: true,
    imageGeneration: false,
    webBrowsing: false,
    plugins: false,
  }
};

export const validateConfig = () => {
  const warnings: string[] = [];
  
  if (config.groq.apiKey === 'YOUR_GROQ_API_KEY') {
    warnings.push('Groq API key not configured. Please set VITE_GROQ_API_KEY environment variable.');
  }
  
  return warnings;
};
