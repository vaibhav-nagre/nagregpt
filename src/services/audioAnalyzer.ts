export interface AudioAnalysisResult {
  type: 'song' | 'speech' | 'music' | 'ambient' | 'unknown';
  confidence: number;
  analysis: {
    // Song identification
    songMatch?: {
      title: string;
      artist: string;
      album?: string;
      confidence: number;
      matchedLyrics?: string[];
      genre?: string;
      year?: number;
    };
    
    // Audio characteristics
    audioFeatures: {
      duration: number;
      hasVocals: boolean;
      tempo?: number;
      key?: string;
      loudness: number;
      speechRatio: number;
      musicRatio: number;
    };
    
    // Content analysis
    content?: {
      detectedLanguage?: string;
      mood?: string;
      instruments?: string[];
      voiceCharacteristics?: {
        gender?: 'male' | 'female' | 'mixed';
        ageRange?: string;
        accent?: string;
      };
    };
    
    // Real-world applications
    suggestions: string[];
    useCases: string[];
  };
  
  // Raw audio data for further processing
  audioBuffer?: ArrayBuffer;
  sampleRate?: number;
}

export class AudioAnalyzer {
  private static audioContext: AudioContext | null = null;
  
  // Initialize audio context
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }
  
  // Main analysis function
  static async analyzeAudio(audioFile: File): Promise<AudioAnalysisResult> {
    try {
      const audioBuffer = await this.fileToArrayBuffer(audioFile);
      const decodedAudio = await this.decodeAudio(audioBuffer);
      
      // Perform various analyses
      const audioFeatures = await this.extractAudioFeatures(decodedAudio);
      const contentAnalysis = await this.analyzeContent(decodedAudio, audioFeatures);
      const songMatch = await this.identifySong(decodedAudio, audioFeatures);
      
      // Determine audio type
      const type = this.classifyAudioType(audioFeatures, contentAnalysis);
      
      // Generate suggestions and use cases
      const { suggestions, useCases } = this.generateRecommendations(type, audioFeatures, songMatch);
      
      return {
        type,
        confidence: this.calculateOverallConfidence(audioFeatures, contentAnalysis, songMatch),
        analysis: {
          songMatch,
          audioFeatures,
          content: contentAnalysis,
          suggestions,
          useCases
        },
        audioBuffer,
        sampleRate: decodedAudio.sampleRate
      };
      
    } catch (error) {
      console.error('Audio analysis error:', error);
      return this.createErrorResult(audioFile);
    }
  }
  
  // Convert file to array buffer
  private static async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Decode audio data
  private static async decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const audioContext = this.getAudioContext();
    return await audioContext.decodeAudioData(arrayBuffer);
  }
  
  // Extract audio features
  private static async extractAudioFeatures(audioBuffer: AudioBuffer): Promise<AudioAnalysisResult['analysis']['audioFeatures']> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    // Calculate RMS (loudness)
    const rms = Math.sqrt(channelData.reduce((sum, sample) => sum + sample * sample, 0) / channelData.length);
    const loudness = 20 * Math.log10(rms);
    
    // Detect tempo using autocorrelation
    const tempo = this.detectTempo(channelData, sampleRate);
    
    // Analyze frequency content
    const frequencyAnalysis = this.analyzeFrequencies(channelData, sampleRate);
    
    // Detect vocals vs music
    const { speechRatio, musicRatio, hasVocals } = this.detectVocals(frequencyAnalysis);
    
    return {
      duration,
      hasVocals,
      tempo,
      loudness: isFinite(loudness) ? loudness : -60,
      speechRatio,
      musicRatio
    };
  }
  
  // Simple tempo detection using autocorrelation
  private static detectTempo(channelData: Float32Array, sampleRate: number): number {
    const windowSize = Math.floor(sampleRate * 4); // 4 second window
    const data = channelData.slice(0, Math.min(windowSize, channelData.length));
    
    // Apply envelope detection
    const envelope = this.extractEnvelope(data, sampleRate);
    
    // Find peaks in envelope
    const peaks = this.findPeaks(envelope);
    
    if (peaks.length < 2) return 120; // Default tempo
    
    // Calculate average interval between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = Math.round((60 * sampleRate) / avgInterval);
    
    // Clamp to reasonable BPM range
    return Math.max(60, Math.min(200, bpm));
  }
  
  // Extract amplitude envelope
  private static extractEnvelope(data: Float32Array, sampleRate: number): Float32Array {
    const hopSize = Math.floor(sampleRate * 0.01); // 10ms hops
    const envelope = new Float32Array(Math.floor(data.length / hopSize));
    
    for (let i = 0; i < envelope.length; i++) {
      const start = i * hopSize;
      const end = Math.min(start + hopSize, data.length);
      let max = 0;
      
      for (let j = start; j < end; j++) {
        max = Math.max(max, Math.abs(data[j]));
      }
      
      envelope[i] = max;
    }
    
    return envelope;
  }
  
  // Find peaks in signal
  private static findPeaks(data: Float32Array): number[] {
    const peaks = [];
    const threshold = Math.max(...data) * 0.3; // 30% of max amplitude
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > threshold && data[i] > data[i-1] && data[i] > data[i+1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }
  
  // Analyze frequency content using simple FFT approximation
  private static analyzeFrequencies(channelData: Float32Array, _sampleRate: number): any {
    // Simplified frequency analysis
    // In a real implementation, you'd use FFT
    
    const lowFreq = channelData.filter((_, i) => i < channelData.length * 0.1).reduce((sum, val) => sum + Math.abs(val), 0);
    const midFreq = channelData.filter((_, i) => i >= channelData.length * 0.1 && i < channelData.length * 0.6).reduce((sum, val) => sum + Math.abs(val), 0);
    const highFreq = channelData.filter((_, i) => i >= channelData.length * 0.6).reduce((sum, val) => sum + Math.abs(val), 0);
    
    const total = lowFreq + midFreq + highFreq;
    
    return {
      lowFreq: lowFreq / total,
      midFreq: midFreq / total,
      highFreq: highFreq / total,
      spectralCentroid: (lowFreq * 0.1 + midFreq * 0.35 + highFreq * 0.8) / total
    };
  }
  
  // Detect vocals vs instrumental music
  private static detectVocals(frequencyAnalysis: any): { speechRatio: number; musicRatio: number; hasVocals: boolean } {
    // Vocal frequencies typically concentrated in mid-range (300Hz - 3kHz)
    const vocalIndicator = frequencyAnalysis.midFreq;
    
    // Music tends to have more balanced frequency distribution
    const musicIndicator = 1 - Math.abs(0.33 - frequencyAnalysis.lowFreq) - Math.abs(0.33 - frequencyAnalysis.midFreq) - Math.abs(0.33 - frequencyAnalysis.highFreq);
    
    const speechRatio = Math.min(1, vocalIndicator * 1.5);
    const musicRatio = Math.min(1, musicIndicator);
    const hasVocals = speechRatio > 0.4;
    
    return { speechRatio, musicRatio, hasVocals };
  }
  
  // Analyze content characteristics
  private static async analyzeContent(_audioBuffer: AudioBuffer, audioFeatures: any): Promise<AudioAnalysisResult['analysis']['content']> {
    const content: AudioAnalysisResult['analysis']['content'] = {};
    
    // Determine mood based on audio characteristics
    if (audioFeatures.tempo > 140 && audioFeatures.loudness > -10) {
      content.mood = 'energetic';
    } else if (audioFeatures.tempo < 80 && audioFeatures.loudness < -20) {
      content.mood = 'calm';
    } else if (audioFeatures.tempo > 120 && audioFeatures.musicRatio > 0.7) {
      content.mood = 'upbeat';
    } else {
      content.mood = 'neutral';
    }
    
    // Estimate instruments based on frequency analysis
    content.instruments = [];
    if (audioFeatures.musicRatio > 0.6) {
      content.instruments.push('unknown instruments');
    }
    
    // Voice characteristics
    if (audioFeatures.hasVocals) {
      content.voiceCharacteristics = {
        ageRange: 'unknown'
      };
    }
    
    return content;
  }
  
  // Song identification (simplified - in real app, you'd use Shazam API or similar)
  private static async identifySong(_audioBuffer: AudioBuffer, audioFeatures: any): Promise<AudioAnalysisResult['analysis']['songMatch'] | undefined> {
    // This is a simplified version. In a real implementation, you would:
    // 1. Extract audio fingerprints
    // 2. Send to song identification service (Shazam, ACRCloud, etc.)
    // 3. Match against song database
    
    // For demo purposes, we'll create a mock response based on audio characteristics
    if (audioFeatures.hasVocals && audioFeatures.musicRatio > 0.5 && audioFeatures.duration > 30) {
      return {
        title: 'Unknown Song',
        artist: 'Unknown Artist',
        confidence: 0.3, // Low confidence since this is mock
        genre: this.estimateGenre(audioFeatures),
        matchedLyrics: []
      };
    }
    
    return undefined;
  }
  
  // Estimate genre based on audio features
  private static estimateGenre(audioFeatures: any): string {
    if (audioFeatures.tempo > 140 && audioFeatures.loudness > -5) {
      return 'Electronic/Dance';
    } else if (audioFeatures.tempo < 80 && audioFeatures.speechRatio > 0.8) {
      return 'Ballad/Acoustic';
    } else if (audioFeatures.tempo > 120 && audioFeatures.musicRatio > 0.8) {
      return 'Pop/Rock';
    } else if (audioFeatures.speechRatio > 0.9) {
      return 'Spoken Word/Rap';
    } else {
      return 'Unknown';
    }
  }
  
  // Classify audio type
  private static classifyAudioType(audioFeatures: any, _contentAnalysis: any): AudioAnalysisResult['type'] {
    if (audioFeatures.speechRatio > 0.8 && audioFeatures.musicRatio < 0.3) {
      return 'speech';
    } else if (audioFeatures.hasVocals && audioFeatures.musicRatio > 0.4) {
      return 'song';
    } else if (audioFeatures.musicRatio > 0.6) {
      return 'music';
    } else if (audioFeatures.loudness < -30) {
      return 'ambient';
    } else {
      return 'unknown';
    }
  }
  
  // Generate recommendations and use cases
  private static generateRecommendations(type: string, _audioFeatures: any, _songMatch: any): { suggestions: string[]; useCases: string[] } {
    const suggestions: string[] = [];
    const useCases: string[] = [];
    
    switch (type) {
      case 'song':
        suggestions.push(
          'Try humming or singing clearer for better song identification',
          'Record a longer segment for more accurate results',
          'Ensure minimal background noise for better analysis'
        );
        useCases.push(
          'Identify songs you hear but don\'t know',
          'Check your singing accuracy against original songs',
          'Discover similar songs based on your vocal style',
          'Practice vocal training with feedback'
        );
        break;
        
      case 'music':
        suggestions.push(
          'Record instrumental solos to analyze playing technique',
          'Use for music transcription and chord analysis',
          'Compare your playing with original recordings'
        );
        useCases.push(
          'Music education and practice feedback',
          'Instrument recognition and learning',
          'Tempo and rhythm analysis for musicians',
          'Audio quality assessment for recordings'
        );
        break;
        
      case 'speech':
        suggestions.push(
          'Use for voice training and accent analysis',
          'Practice presentations and speeches',
          'Analyze speaking patterns and pace'
        );
        useCases.push(
          'Voice coaching and improvement',
          'Language learning pronunciation practice',
          'Public speaking training',
          'Accent reduction exercises'
        );
        break;
        
      case 'ambient':
        suggestions.push(
          'Analyze environmental sounds',
          'Identify background noise sources',
          'Check audio recording quality'
        );
        useCases.push(
          'Sound environment analysis',
          'Noise pollution monitoring',
          'Audio equipment testing',
          'Field recording analysis'
        );
        break;
        
      default:
        suggestions.push(
          'Try recording with better audio quality',
          'Ensure the audio is clear and loud enough',
          'Record in a quieter environment'
        );
        useCases.push(
          'General audio analysis',
          'Audio troubleshooting',
          'Sound identification'
        );
    }
    
    return { suggestions, useCases };
  }
  
  // Calculate overall confidence
  private static calculateOverallConfidence(audioFeatures: any, _contentAnalysis: any, songMatch: any): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on audio quality
    if (audioFeatures.loudness > -20) confidence += 0.2;
    if (audioFeatures.duration > 10) confidence += 0.1;
    
    // Increase confidence based on clear characteristics
    if (audioFeatures.hasVocals) confidence += 0.1;
    if (audioFeatures.speechRatio > 0.7 || audioFeatures.musicRatio > 0.7) confidence += 0.1;
    
    // Song match confidence
    if (songMatch && songMatch.confidence > 0.5) confidence += 0.2;
    
    return Math.min(1, confidence);
  }
  
  // Create error result
  private static createErrorResult(_audioFile: File): AudioAnalysisResult {
    return {
      type: 'unknown',
      confidence: 0,
      analysis: {
        audioFeatures: {
          duration: 0,
          hasVocals: false,
          loudness: -60,
          speechRatio: 0,
          musicRatio: 0
        },
        suggestions: [
          'Audio file could not be analyzed',
          'Please try with a different audio format',
          'Ensure the audio file is not corrupted'
        ],
        useCases: [
          'File format conversion might be needed',
          'Try recording again with better quality'
        ]
      }
    };
  }
  
  // Format analysis for AI prompt
  static formatAnalysisForAI(analysis: AudioAnalysisResult, userMessage: string): string {
    const { type, confidence, analysis: details } = analysis;
    
    let prompt = `User message: ${userMessage}\n\n`;
    prompt += `Audio Analysis Results:\n`;
    prompt += `- Type: ${type} (${Math.round(confidence * 100)}% confidence)\n`;
    prompt += `- Duration: ${Math.round(details.audioFeatures.duration)}s\n`;
    prompt += `- Has Vocals: ${details.audioFeatures.hasVocals ? 'Yes' : 'No'}\n`;
    
    if (details.audioFeatures.tempo) {
      prompt += `- Tempo: ~${details.audioFeatures.tempo} BPM\n`;
    }
    
    if (details.songMatch) {
      prompt += `\nSong Match:\n`;
      prompt += `- Title: ${details.songMatch.title}\n`;
      prompt += `- Artist: ${details.songMatch.artist}\n`;
      prompt += `- Genre: ${details.songMatch.genre}\n`;
      prompt += `- Confidence: ${Math.round(details.songMatch.confidence * 100)}%\n`;
    }
    
    if (details.content) {
      prompt += `\nContent Analysis:\n`;
      prompt += `- Mood: ${details.content.mood}\n`;
      if (details.content.instruments?.length) {
        prompt += `- Instruments: ${details.content.instruments.join(', ')}\n`;
      }
    }
    
    prompt += `\nSuggestions for improvement:\n`;
    details.suggestions.forEach(suggestion => {
      prompt += `- ${suggestion}\n`;
    });
    
    prompt += `\nPotential use cases:\n`;
    details.useCases.forEach(useCase => {
      prompt += `- ${useCase}\n`;
    });
    
    prompt += `\nPlease provide detailed analysis and feedback based on the audio characteristics above. If this is a song attempt, provide constructive feedback. If it's speech, analyze the vocal qualities. For instrumental music, comment on the musical elements detected.`;
    
    return prompt;
  }
}
