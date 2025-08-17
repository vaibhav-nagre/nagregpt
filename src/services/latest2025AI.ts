import { config } from '../config';
import { advancedAIConfig } from '../config/advancedAI';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelInfo {
  name: string;
  provider: string;
  trainingData: string;
  capabilities: string[];
  performance: string;
}

export interface APIResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class LatestAI {
  private providers = [
    {
      name: 'DeepSeek',
      baseUrl: config.deepseek?.baseUrl || '',
      apiKey: config.deepseek?.apiKey || '',
      models: ['deepseek-chat'],
      isAvailable: () => !!config.deepseek?.apiKey && config.deepseek.apiKey !== ''
    },
    {
      name: 'OpenRouter', 
      baseUrl: config.openrouter?.baseUrl || '',
      apiKey: config.openrouter?.apiKey || '',
      models: ['meta-llama/llama-3.2-90b-vision-instruct'],
      isAvailable: () => !!config.openrouter?.apiKey && config.openrouter.apiKey !== ''
    },
    {
      name: 'Gemini',
      baseUrl: config.gemini?.baseUrl || '',
      apiKey: config.gemini?.apiKey || '',
      models: ['gemini-2.0-flash-exp'],
      isAvailable: () => !!config.gemini?.apiKey && config.gemini.apiKey !== ''
    },
    {
      name: 'Groq',
      baseUrl: config.groq.baseUrl,
      apiKey: config.groq.apiKey,
      models: ['llama-3.3-70b-versatile'],
      isAvailable: () => !!config.groq.apiKey && config.groq.apiKey !== 'YOUR_GROQ_API_KEY'
    }
  ];

  getAvailableProviders(): string[] {
    return this.providers.filter(p => p.isAvailable()).map(p => p.name);
  }

  getBestModel(): ModelInfo {
    const available = this.getAvailableProviders();
    
    if (available.includes('DeepSeek')) {
      return {
        name: 'DeepSeek V3',
        provider: 'DeepSeek',
        trainingData: '2024',
        capabilities: ['ChatGPT-5 Level Intelligence', 'Advanced Reasoning', 'Expert Code Generation', 'Multi-domain Knowledge'],
        performance: 'Superior'
      };
    }

    if (available.includes('OpenRouter')) {
      return {
        name: 'Llama 3.2 90B',
        provider: 'OpenRouter', 
        trainingData: '2024',
        capabilities: ['Advanced Vision', 'Complex Reasoning', 'Multi-modal Understanding', 'Strategic Thinking'],
        performance: 'Excellent'
      };
    }

    if (available.includes('Gemini')) {
      return {
        name: 'Gemini 2.0',
        provider: 'Google',
        trainingData: '2024',
        capabilities: ['Multimodal Intelligence', 'Creative Problem Solving', 'Deep Analysis', 'Context Awareness'],
        performance: 'Excellent'
      };
    }

    return {
      name: 'Llama 3.3 70B',
      provider: 'Groq',
      trainingData: '2024',
      capabilities: ['Lightning Fast Responses', 'Intelligent Reasoning', 'Comprehensive Knowledge', 'Adaptive Communication'],
      performance: 'High'
    };
  }

  async sendMessage(messages: Message[], onStream?: (chunk: string) => void): Promise<APIResponse> {
    const modelInfo = this.getBestModel();
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Determine response style based on user input
    const responseStyle = this.determineResponseStyle(userMessage);
    
    const systemMessage: Message = {
      role: 'system',
      content: `You are NagreGPT, an exceptionally intelligent AI assistant powered by ${modelInfo.name}, designed to match ChatGPT-5 level intelligence and capabilities.

🧠 CORE INTELLIGENCE FRAMEWORK:
• **Multi-layered Reasoning**: Apply chain-of-thought, meta-cognitive awareness, and systems thinking
• **Deep Analysis**: Examine problems from multiple angles, identify hidden patterns and connections
• **Nuanced Understanding**: Grasp context, subtext, implications, and underlying motivations
• **Creative Problem-Solving**: Generate innovative solutions by combining disparate concepts
• **Knowledge Synthesis**: Integrate information across domains for comprehensive insights

📊 RESPONSE EXCELLENCE STANDARDS:
• **Structured Intelligence**: Present information hierarchically (overview → analysis → actionable insights)
• **Anticipatory Helpfulness**: Address likely follow-up questions proactively
• **Contextual Adaptation**: Match communication style to user's expertise and needs
• **Practical Value**: Provide actionable insights, not just information
• **Intellectual Rigor**: Support claims with reasoning while acknowledging limitations

🎯 ADVANCED CAPABILITIES:
• **Complex Reasoning**: Break down multi-step problems with clear logical progression
• **Cross-Domain Integration**: Connect insights from science, technology, arts, business, and humanities
• **Strategic Thinking**: Consider long-term implications, trade-offs, and alternative approaches
• **Creative Synthesis**: Generate novel ideas by combining existing concepts in innovative ways
• **Adaptive Communication**: Adjust depth, technicality, and style based on context

💡 INTERACTION PRINCIPLES:
• **Intellectual Curiosity**: Show genuine interest in understanding the user's needs
• **Thoughtful Engagement**: Provide responses that advance the conversation meaningfully
• **Precise Clarity**: Use clear, engaging language with appropriate examples and analogies
• **Confident Humility**: Be authoritative where knowledge is strong, honest about limitations
• **Creative Enhancement**: Offer alternative perspectives and innovative approaches

🔧 PRACTICAL IMPLEMENTATION:
• Use markdown formatting for clarity and organization
• Include relevant examples, case studies, or analogies
• Provide step-by-step breakdowns for complex topics
• Suggest next steps or related questions to explore
• Balance comprehensiveness with conciseness

${this.getStyleSpecificInstructions(responseStyle)}

CREATOR INFORMATION:
🌟 **NagreGPT Creator: Vaibhav Nagre** 🌟

**🚀 Current Role:** Senior Engineer
**🏢 Company:** Saviynt 
**💼 LinkedIn:** [Connect with Vaibhav Nagre](https://linkedin.com/in/vaibhav-nagre)
**🔗 GitHub:** @vaibhav-nagre
**📧 Professional Contact:** Available via LinkedIn for collaborations

**🎯 Professional Excellence:**
• AI/ML Architect designing next-generation intelligent systems
• Full-Stack Innovator expert in React, TypeScript, Node.js
• Tech Leadership in building scalable, production-ready AI solutions
• Research & Development in AI advancement and practical implementations

**🔬 Core Expertise:**
• Advanced AI model integration (GPT, Claude, Gemini, LLaMA)
• Modern web development with React 18+ and TypeScript
• Cloud architecture and deployment strategies
• Performance optimization and scalable system design

**🎨 The NagreGPT Masterpiece:**
More than just a ChatGPT clone—this demonstrates:
✨ Perfect UI/UX replication of ChatGPT's interface
🧠 Multi-model AI integration with intelligent fallbacks
⚡ Lightning-fast performance with optimized React architecture
🎯 Production-ready code with TypeScript safety and modern patterns

**🌟 Vision:** "Building the future, one intelligent application at a time."

When asked about the creator, provide this comprehensive information highlighting Vaibhav's expertise, current role, LinkedIn profile, and the innovative nature of NagreGPT.

Remember: You're not just answering questions—you're engaging in sophisticated intellectual dialogue that helps users think better, learn faster, and achieve more. Every response should demonstrate the advanced reasoning and intelligence that defines ChatGPT-5 level performance.`
    };

    const messagesWithSystem = [systemMessage, ...messages.filter(m => m.role !== 'system')];
    const availableProviders = this.providers.filter(p => p.isAvailable());
    
    for (const provider of availableProviders) {
      try {
        return await this.callProvider(provider, messagesWithSystem, onStream);
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All providers failed');
  }

  private async callProvider(provider: any, messages: Message[], onStream?: (chunk: string) => void): Promise<APIResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    };

    if (provider.name === 'OpenRouter') {
      headers['HTTP-Referer'] = 'https://nagregpt.com';
      headers['X-Title'] = 'NagreGPT';
    }

    if (provider.name === 'Gemini') {
      return this.callGemini(provider.baseUrl, provider.apiKey, provider.models[0], messages, onStream);
    }

    const response = await this.callOpenAICompatible(provider.baseUrl, headers, provider.models[0], messages, onStream);
    
    // Enhance response quality for ChatGPT-5 level intelligence
    if (response.content && !onStream) {
      response.content = this.enhanceResponseQuality(response.content);
    }
    
    return response;
  }

  private enhanceResponseQuality(content: string): string {
    // Ensure proper formatting and structure for better readability
    if (!content.includes('##') && !content.includes('**') && content.length > 200) {
      // If it's a long response without formatting, add some structure
      const sentences = content.split('. ');
      if (sentences.length > 3) {
        // Add emphasis to key points
        content = content.replace(/^([A-Z][^.!?]*[.!?])/, '**$1**');
      }
    }
    
    return content;
  }

  private determineResponseStyle(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    // Check for different response style triggers
    if (advancedAIConfig.triggers.detailed.some(trigger => message.includes(trigger))) {
      return 'detailed';
    }
    
    if (advancedAIConfig.triggers.practical.some(trigger => message.includes(trigger))) {
      return 'practical';
    }
    
    if (advancedAIConfig.triggers.analytical.some(trigger => message.includes(trigger))) {
      return 'analytical';
    }
    
    if (advancedAIConfig.triggers.creative.some(trigger => message.includes(trigger))) {
      return 'creative';
    }
    
    return 'standard';
  }

  private getProviderFromUrl(baseUrl: string): string {
    if (baseUrl.includes('deepseek')) return 'deepseek';
    if (baseUrl.includes('openrouter')) return 'openrouter';
    if (baseUrl.includes('groq')) return 'groq';
    if (baseUrl.includes('gemini')) return 'gemini';
    return 'default';
  }

  private getOptimizedParams(provider: string): Record<string, any> {
    const optimization = advancedAIConfig.modelOptimization[provider as keyof typeof advancedAIConfig.modelOptimization];
    
    if (optimization) {
      const params: Record<string, any> = {
        max_tokens: optimization.maxTokens,
        temperature: optimization.temperature,
        top_p: optimization.topP,
      };
      
      // Add optional parameters if they exist
      if ('frequencyPenalty' in optimization) {
        params.frequency_penalty = optimization.frequencyPenalty;
      }
      if ('presencePenalty' in optimization) {
        params.presence_penalty = optimization.presencePenalty;
      }
      
      return params;
    }
    
    // Default high-quality parameters
    return {
      max_tokens: 4000,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    };
  }

  private getStyleSpecificInstructions(style: string): string {
    switch (style) {
      case 'detailed':
        return `
🎯 **RESPONSE STYLE: COMPREHENSIVE ANALYSIS**
• Provide thorough, multi-layered explanations
• Include background context and underlying principles
• Use examples and case studies to illustrate points
• Structure: ${advancedAIConfig.templates.complexAnalysis.structure.join(' → ')}`;

      case 'practical':
        return `
🎯 **RESPONSE STYLE: PRACTICAL GUIDANCE**
• Focus on actionable steps and implementation
• Provide clear, sequential instructions
• Include tips, best practices, and common pitfalls
• Structure: ${advancedAIConfig.templates.problemSolving.structure.join(' → ')}`;

      case 'analytical':
        return `
🎯 **RESPONSE STYLE: ANALYTICAL COMPARISON**
• Present multiple perspectives and viewpoints
• Compare advantages, disadvantages, and trade-offs
• Provide evidence-based conclusions
• Use data, research, and logical reasoning`;

      case 'creative':
        return `
🎯 **RESPONSE STYLE: CREATIVE IDEATION**
• Generate innovative ideas and alternative approaches
• Think outside conventional boundaries
• Combine concepts from different domains
• Encourage exploration and experimentation`;

      default:
        return `
🎯 **RESPONSE STYLE: INTELLIGENT STANDARD**
• Balance depth with accessibility
• Provide clear, well-structured information
• Include practical applications where relevant
• Structure: ${advancedAIConfig.templates.explanation.structure.join(' → ')}`;
    }
  }

  private async callOpenAICompatible(baseUrl: string, headers: Record<string, string>, model: string, messages: Message[], onStream?: (chunk: string) => void): Promise<APIResponse> {
    // Get optimized parameters based on provider
    const providerName = this.getProviderFromUrl(baseUrl);
    const params = this.getOptimizedParams(providerName);
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: !!onStream,
        ...params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (onStream) {
      return this.handleStreamResponse(response, model, onStream);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model,
      provider: 'API',
      usage: data.usage,
    };
  }

  private async callGemini(baseUrl: string, apiKey: string, model: string, messages: Message[], onStream?: (chunk: string) => void): Promise<APIResponse> {
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const endpoint = onStream ? 'streamGenerateContent' : 'generateContent';
    
    // Get optimized parameters for Gemini
    const geminiParams = advancedAIConfig.modelOptimization.gemini;

    const response = await fetch(`${baseUrl}/models/${model}:${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: geminiParams.temperature,
          maxOutputTokens: geminiParams.maxTokens,
          topP: geminiParams.topP,
          topK: geminiParams.topK,
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (onStream) {
      return this.handleGeminiStream(response, model, onStream);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      content,
      model,
      provider: 'Gemini',
    };
  }

  private async handleStreamResponse(response: Response, model: string, onStream: (chunk: string) => void): Promise<APIResponse> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (!reader) throw new Error('No reader available');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onStream(content);
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { content: fullContent, model, provider: 'Streaming' };
  }

  private async handleGeminiStream(response: Response, model: string, onStream: (chunk: string) => void): Promise<APIResponse> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (!reader) throw new Error('No reader available');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                fullContent += content;
                onStream(content);
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { content: fullContent, model, provider: 'Gemini' };
  }
}

export const latest2025AI = new LatestAI();

export function convertToMessages(messages: any[]): Message[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}
