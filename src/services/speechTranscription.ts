/**
 * Speech Transcription Service
 * Provides audio-to-text transcription capabilities
 */

interface TranscriptionOptions {
  language?: string;
  punctuation?: boolean;
  speakerDiarization?: boolean;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  duration?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

class SpeechTranscriptionService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  async transcribeWithWhisper(
    audioBlob: Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult | null> {
    if (!this.apiKey) {
      console.warn('No API key provided for transcription');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', options.language || 'en');
      formData.append('response_format', 'verbose_json');
      
      if (options.punctuation) {
        formData.append('temperature', '0');
      }

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        text: result.text,
        confidence: 1.0, // Whisper doesn't provide confidence scores
        duration: result.duration,
        words: result.words?.map((word: any) => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: 1.0,
        })),
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    }
  }

  /**
   * Transcribe audio using Web Speech API (fallback)
   */
  async transcribeWithWebAPI(audioBlob: Blob): Promise<TranscriptionResult | null> {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return null;
    }

    return new Promise((resolve) => {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          
          resolve({
            text: transcript,
            confidence: confidence || 0.8,
          });
        };

        recognition.onerror = () => {
          resolve(null);
        };

        recognition.onend = () => {
          // If no result was captured, resolve with null
          setTimeout(() => resolve(null), 100);
        };

        // Create audio URL and play it for recognition
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onplay = () => {
          recognition.start();
        };
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };

        audio.play();
      } catch (error) {
        console.error('Web Speech API error:', error);
        resolve(null);
      }
    });
  }

  /**
   * Auto transcribe with fallback strategy
   */
  async transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult | null> {
    // Try Whisper API first (more accurate)
    if (this.apiKey) {
      const whisperResult = await this.transcribeWithWhisper(audioBlob, options);
      if (whisperResult) {
        return whisperResult;
      }
    }

    // Fallback to Web Speech API
    return await this.transcribeWithWebAPI(audioBlob);
  }

  /**
   * Check if transcription is available
   */
  isAvailable(): boolean {
    return !!(
      this.apiKey || 
      ('webkitSpeechRecognition' in window) || 
      ('SpeechRecognition' in window)
    );
  }
}

// Export singleton instance
export const speechTranscription = new SpeechTranscriptionService();
export default speechTranscription;
export type { TranscriptionOptions, TranscriptionResult };
