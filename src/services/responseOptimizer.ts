export interface ResponseOptimizationOptions {
  maxLength?: number;
  conciseness?: 'brief' | 'balanced' | 'detailed';
  removeRedundancy?: boolean;
  improveFlow?: boolean;
  enhanceClarity?: boolean;
}

export class ResponseOptimizer {
  /**
   * Optimize response for ChatGPT-like quality and conciseness
   */
  static optimizeResponse(
    content: string, 
    _userQuery: string, 
    options: ResponseOptimizationOptions = {}
  ): string {
    const {
      maxLength = 2000,
      conciseness = 'balanced',
      removeRedundancy = true,
      improveFlow = true,
      enhanceClarity = true
    } = options;

    let optimized = content;

    // Step 1: Remove source attributions and technical artifacts
    optimized = this.removeSourceAttributions(optimized);

    // Step 2: Apply conciseness based on user preference
    optimized = this.applyConciseness(optimized, conciseness);

    // Step 3: Remove redundancy
    if (removeRedundancy) {
      optimized = this.removeRedundancy(optimized);
    }

    // Step 4: Improve flow and readability
    if (improveFlow) {
      optimized = this.improveFlow(optimized);
    }

    // Step 5: Enhance clarity
    if (enhanceClarity) {
      optimized = this.enhanceClarity(optimized);
    }

    // Step 6: Ensure appropriate length
    if (optimized.length > maxLength && conciseness !== 'detailed') {
      optimized = this.truncateIntelligently(optimized, maxLength);
    }

    return optimized.trim();
  }

  /**
   * Remove all source attributions and technical language
   */
  private static removeSourceAttributions(content: string): string {
    const patterns = [
      /according to [^,\n]*/gi,
      /based on [^,\n]*/gi,
      /sources (say|indicate|suggest|show|report) that/gi,
      /research (shows|indicates|suggests) that/gi,
      /studies (show|indicate|suggest) that/gi,
      /data (shows|indicates|suggests) that/gi,
      /reports (say|indicate|suggest|show) that/gi,
      /experts (say|believe|think|suggest) that/gi,
      /analysts (predict|forecast|expect|believe) that/gi,
      /as reported by [^,\n]*/gi,
      /as stated in [^,\n]*/gi,
      /as mentioned in [^,\n]*/gi,
      /via web search[^,\n]*/gi,
      /from online sources[^,\n]*/gi,
      /web search results show[^,\n]*/gi,
      /search results indicate[^,\n]*/gi,
    ];

    let cleaned = content;
    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Clean up any double spaces or awkward transitions
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\s*,\s*,/g, ',');
    cleaned = cleaned.replace(/\.\s*\./g, '.');
    
    return cleaned;
  }

  /**
   * Apply conciseness level
   */
  private static applyConciseness(content: string, level: 'brief' | 'balanced' | 'detailed'): string {
    if (level === 'detailed') {
      return content;
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    if (level === 'brief') {
      // Keep only the most essential sentences (first 2-3)
      return sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
    }

    // Balanced: Remove less important sentences
    const importantSentences = sentences.filter((sentence, index) => {
      const lowerSentence = sentence.toLowerCase().trim();
      
      // Keep first and last sentences
      if (index === 0 || index === sentences.length - 1) return true;
      
      // Keep sentences with key information
      const keyPhrases = ['important', 'significant', 'key', 'main', 'primary', 'essential', 'crucial', 'critical'];
      if (keyPhrases.some(phrase => lowerSentence.includes(phrase))) return true;
      
      // Keep sentences with numbers/data
      if (/\d+/.test(sentence)) return true;
      
      // Remove filler sentences
      const fillerPhrases = ['additionally', 'furthermore', 'moreover', 'in addition', 'also worth noting'];
      if (fillerPhrases.some(phrase => lowerSentence.includes(phrase))) return false;
      
      return sentences.length <= 4 || Math.random() > 0.3; // Keep most sentences for balanced
    });

    return importantSentences.join('. ') + '.';
  }

  /**
   * Remove redundant information
   */
  private static removeRedundancy(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const uniqueSentences: string[] = [];
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim().toLowerCase();
      const isRedundant = uniqueSentences.some(existing => {
        const existingTrimmed = existing.trim().toLowerCase();
        // Check for similar meaning (basic heuristic)
        const similarity = this.calculateSimilarity(trimmed, existingTrimmed);
        return similarity > 0.7;
      });
      
      if (!isRedundant && trimmed.length > 10) {
        uniqueSentences.push(sentence.trim());
      }
    });

    return uniqueSentences.join('. ') + '.';
  }

  /**
   * Improve flow and readability
   */
  private static improveFlow(content: string): string {
    let improved = content;

    // Add smooth transitions
    improved = improved.replace(/\. ([A-Z])/g, (_match, letter) => {
      const transitions = ['Additionally, ', 'Furthermore, ', 'Moreover, ', 'However, ', ''];
      const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
      return '. ' + randomTransition + letter;
    });

    // Improve paragraph structure
    const sentences = improved.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 4) {
      const midPoint = Math.floor(sentences.length / 2);
      improved = sentences.slice(0, midPoint).join('. ') + '.\n\n' + 
                sentences.slice(midPoint).join('. ') + '.';
    }

    return improved;
  }

  /**
   * Enhance clarity and readability
   */
  private static enhanceClarity(content: string): string {
    let enhanced = content;

    // Replace technical jargon with simpler terms
    const replacements = {
      'utilize': 'use',
      'facilitate': 'help',
      'commence': 'start',
      'implement': 'put in place',
      'demonstrate': 'show',
      'indicates': 'shows',
      'subsequent': 'next',
      'approximately': 'about',
      'predominantly': 'mainly'
    };

    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      enhanced = enhanced.replace(regex, simple);
    });

    // Improve sentence structure
    enhanced = enhanced.replace(/,\s*which\s+/g, '. This ');
    enhanced = enhanced.replace(/,\s*that\s+/g, '. It ');

    return enhanced;
  }

  /**
   * Intelligently truncate content while preserving meaning
   */
  private static truncateIntelligently(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;

    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let truncated = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceWithPunctuation = sentence.trim() + '.';
      if (currentLength + sentenceWithPunctuation.length <= maxLength - 3) {
        truncated += (truncated ? ' ' : '') + sentenceWithPunctuation;
        currentLength += sentenceWithPunctuation.length;
      } else {
        break;
      }
    }

    // If we couldn't fit any complete sentences, truncate the first sentence
    if (!truncated && sentences.length > 0) {
      truncated = sentences[0].substring(0, maxLength - 3).trim() + '...';
    }

    return truncated || content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Calculate similarity between two strings (basic implementation)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    const commonWords = words1.filter(word => 
      words2.some(w => w.toLowerCase() === word.toLowerCase())
    );
    
    const totalWords = Math.max(words1.length, words2.length);
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  /**
   * Determine appropriate conciseness level based on query
   */
  static determineConciseness(userQuery: string): 'brief' | 'balanced' | 'detailed' {
    const query = userQuery.toLowerCase();
    
    // Brief responses for simple questions
    if (query.includes('what is') || query.includes('define') || query.includes('explain briefly')) {
      return 'brief';
    }
    
    // Detailed responses when explicitly requested
    if (query.includes('detailed') || query.includes('comprehensive') || 
        query.includes('explain in detail') || query.includes('tell me everything')) {
      return 'detailed';
    }
    
    // Balanced for everything else
    return 'balanced';
  }
}
