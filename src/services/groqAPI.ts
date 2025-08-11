import { config } from '../config';

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
    
    try {
      const requestBody = {
        model,
        messages,
        stream: !!onStream,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: null,
      };
      
      console.log('📤 Sending request to Groq API');
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);

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
  return [
    {
      role: 'system',
      content: `You are NagreGPT, a helpful AI assistant. You should:

- Be conversational and natural in your responses
- Provide accurate and helpful information
- Ask clarifying questions when needed
- Be concise but thorough
- Format code blocks with proper syntax highlighting when sharing code
- Use markdown formatting for better readability
- Be creative and engaging while staying professional
- Maintain context throughout the conversation

Respond in a helpful, friendly, and informative manner similar to ChatGPT.`,
    },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];
}
