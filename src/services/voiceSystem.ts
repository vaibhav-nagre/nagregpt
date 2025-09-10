interface VoiceConfig {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
}

// Voice conversation interface (not currently used but defined for future implementation)
/*
interface VoiceConversation {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
}
*/

/**
 * Advanced Voice Conversation System
 * Natural voice interaction with AI
 */
export class VoiceSystem {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private config: VoiceConfig;
  private onTranscript?: (text: string, confidence: number) => void;
  private onSpeechEnd?: () => void;
  private onError?: (error: string) => void;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.config = {
      voice: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      language: 'en-US'
    };
    
    this.initializeRecognition();
    this.initializeVoices();
  }

  private initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = 3;
      
      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let confidence = 0;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            confidence = result[0].confidence;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        if (finalTranscript && this.onTranscript) {
          this.onTranscript(finalTranscript.trim(), confidence);
        }
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (this.onError) {
          this.onError(`Speech recognition error: ${event.error}`);
        }
      };
      
      this.recognition.onend = () => {
        if (this.onSpeechEnd) {
          this.onSpeechEnd();
        }
      };
    }
  }

  private initializeVoices() {
    const setVoices = () => {
      const voices = this.synthesis.getVoices();
      // Prefer neural/premium voices
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(this.config.language) && 
        (voice.name.includes('Neural') || voice.name.includes('Premium') || voice.default)
      ) || voices.find(voice => voice.lang.startsWith(this.config.language)) || voices[0];
      
      this.config.voice = preferredVoice;
    };

    setVoices();
    this.synthesis.onvoiceschanged = setVoices;
  }

  /**
   * Start voice conversation
   */
  startListening(
    onTranscript: (text: string, confidence: number) => void,
    onSpeechEnd?: () => void,
    onError?: (error: string) => void
  ): boolean {
    if (!this.recognition) {
      if (onError) onError('Speech recognition not supported');
      return false;
    }

    this.onTranscript = onTranscript;
    this.onSpeechEnd = onSpeechEnd;
    this.onError = onError;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      if (onError) onError('Failed to start speech recognition');
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Speak text with natural voice
   */
  speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply configuration
      utterance.rate = options?.rate || this.config.rate;
      utterance.pitch = options?.pitch || this.config.pitch;
      utterance.volume = options?.volume || this.config.volume;
      utterance.lang = this.config.language;
      
      // Set voice
      if (options?.voice) {
        const voices = this.synthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else if (this.config.voice) {
        utterance.voice = this.config.voice;
      }

      // Event handlers
      utterance.onstart = () => {
        if (options?.onStart) options.onStart();
      };

      utterance.onend = () => {
        if (options?.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (event) => {
        const error = `Speech synthesis error: ${event.error}`;
        console.error(error);
        if (options?.onError) options.onError(error);
        reject(new Error(error));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Set voice configuration
   */
  setVoiceConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.language && this.recognition) {
      this.recognition.lang = config.language;
    }
  }

  /**
   * Get current voice configuration
   */
  getVoiceConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Test voice system
   */
  async testVoice(): Promise<boolean> {
    try {
      await this.speak('Hello! Voice system is working perfectly. I can hear and speak naturally.');
      return true;
    } catch (error) {
      console.error('Voice test failed:', error);
      return false;
    }
  }

  /**
   * Process natural conversation
   */
  async processNaturalConversation(
    text: string,
    onResponse: (response: string) => Promise<string>,
    speakResponse: boolean = true
  ): Promise<string> {
    try {
      // Add natural conversation processing
      const enhancedText = this.enhanceForConversation(text);
      
      // Get AI response
      const response = await onResponse(enhancedText);
      
      // Speak response if enabled
      if (speakResponse && response) {
        const spokenText = this.prepareForSpeech(response);
        await this.speak(spokenText);
      }
      
      return response;
    } catch (error) {
      console.error('Natural conversation processing failed:', error);
      throw error;
    }
  }

  private enhanceForConversation(text: string): string {
    // Add conversational context
    const conversationalMarkers = [
      'This is a voice conversation.',
      'Please respond naturally as if speaking.',
      'Keep the response conversational and engaging.',
      'Avoid complex formatting in your response.'
    ];
    
    return `${conversationalMarkers.join(' ')}\n\nUser said: "${text}"`;
  }

  private prepareForSpeech(text: string): string {
    // Remove markdown formatting for speech
    let spokenText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italics
      .replace(/`(.*?)`/g, '$1') // Remove code backticks
      .replace(/#{1,6}\s*(.*)/g, '$1') // Remove headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
      .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
      .replace(/- (.*)/g, '$1') // Remove bullet points
      .replace(/\n\s*\n/g, '. ') // Replace double line breaks
      .replace(/\n/g, '. ') // Replace single line breaks
      .trim();

    // Add natural pauses for better speech
    spokenText = spokenText
      .replace(/\. /g, '. ') // Ensure proper spacing
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2'); // Add pause between sentences

    return spokenText;
  }

  /**
   * Get system capabilities
   */
  getCapabilities(): {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    voiceCount: number;
    supportedLanguages: string[];
  } {
    const voices = this.getAvailableVoices();
    const languages = [...new Set(voices.map(v => v.lang))];

    return {
      speechRecognition: !!this.recognition,
      speechSynthesis: !!this.synthesis,
      voiceCount: voices.length,
      supportedLanguages: languages
    };
  }
}

export const voiceSystem = new VoiceSystem();
