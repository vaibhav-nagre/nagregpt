import { config } from '../config';
import { FeedbackManager } from '../utils/feedbackManager';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = config.groq.apiKey, baseUrl: string = config.groq.baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async sendMessage(
    messages: GroqMessage[],
    model: string = config.groq.models.default,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    console.log('🔥 Groq API - Starting request');
    console.log('📨 API Key available:', !!this.apiKey && this.apiKey !== 'YOUR_GROQ_API_KEY');
    console.log('🌐 Base URL:', this.baseUrl);
    console.log('🤖 Model:', model);
    console.log('💬 Messages count:', messages.length);
    console.log('📝 Messages:', messages);
    
    try {
      const requestBody = {
        model,
        messages,
        stream: !!onStream,
        max_tokens: 4096, // Reduced from 8192 to encourage shorter responses
        temperature: 0.5, // Reduced from 0.7 for more focused responses
        top_p: 0.8, // Reduced from 0.9 for more focused responses
        frequency_penalty: 0.2, // Increased to reduce repetition
        presence_penalty: 0.2, // Increased to encourage conciseness
        stop: null,
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        console.error('❌ API Error Data:', errorData);
        throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
      }

      if (onStream) {
        console.log('🌊 Starting stream response');
        return this.handleStreamResponse(response, onStream);
      } else {
        console.log('📄 Processing non-stream response');
        const data: GroqResponse = await response.json();
        console.log('📄 Response data:', data);
        return data.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('❌ Groq API error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to communicate with Groq API');
    }
  }

  private async handleStreamResponse(
    response: Response,
    onStream: (chunk: string) => void
  ): Promise<string> {
    console.log('🌊 Handling stream response');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader available');

    const decoder = new TextDecoder();
    let fullContent = '';
    let chunkCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ Stream completed, total chunks:', chunkCount);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('🏁 Stream finished with [DONE]');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onStream(content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
              console.log('⚠️ Parsing error (normal for incomplete chunks):', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log('✅ Stream response complete, total length:', fullContent.length);
    return fullContent;
  }

  // Get available models
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return Object.values(config.groq.models);
    }
  }
}

// Export singleton instance
export const groqAPI = new GroqAPI();

// Utility function to convert our Message type to Groq format
export function convertToGroqMessages(messages: { role: 'user' | 'assistant'; content: string }[]): GroqMessage[] {
  // Get learning context from user feedback
  const learningContext = FeedbackManager.generateLearningContext();
  
  return [
    {
      role: 'system',
      content: `You are NagreGPT, a helpful AI assistant. Be concise and direct in your responses.

Key behaviors:
- Answer exactly what is asked - no more, no less
- Be brief and to the point
- Only provide code when specifically requested
- Don't add extra explanations unless asked
- Use simple, clear language
- Stick to the specific question or task
- If asked a yes/no question, give a yes/no answer first
- Only elaborate when explicitly requested
- Maintain context from previous messages in the conversation
- Learn from user feedback: 👍 = good response, 👎 = needs improvement, ❤️ = excellent response
- Adapt your response style based on what the user seems to prefer
- Remember what the user has asked before and build upon that knowledge

Focus on giving precise, focused answers that directly address the user's question without unnecessary details while maintaining conversation context.${learningContext}`,
    },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];
}
