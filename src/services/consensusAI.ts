import { config } from '../config';
import type { Message } from '../types';

export interface CandidateResponse {
  content: string;
  model: string;
  provider: string;
  temperature: number;
  confidence: number;
  timestamp: number;
}

export interface ConsensusResult {
  finalAnswer: string;
  confidence: 'HIGH' | 'LOW';
  candidates: CandidateResponse[];
  synthesis?: string;
  verification?: string;
  reasoning: string;
  agreementScore: number;
}

export interface CacheEntry {
  result: ConsensusResult;
  timestamp: number;
  expiresAt: number;
}

class ConsensusAI {
  private cache = new Map<string, CacheEntry>();
  private sessionId: string;
  private cacheExpiryMs = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(userMessage: string, systemPrompt: string): string {
    // Create deterministic hash for caching
    const combined = `${userMessage}|${systemPrompt}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `consensus_${Math.abs(hash)}`;
  }

  private getSystemPrompt(): string {
    const availableProviders = this.getAvailableProviders();
    const consensusStatus = availableProviders.length >= 2 ? 'Multi-model consensus enabled' : 'Single model mode';

    return `You are NagreGPT, an advanced AI assistant by Vaibhav Nagre that delivers exceptional intelligence through revolutionary consensus technology.

**QUALITY TARGET:** Exceptional responses with maximum accuracy and relevance
**SYSTEM:** ${consensusStatus} (${availableProviders.length} models working together)

**RESPONSE QUALITY STANDARDS:**
- PRECISION: Every fact must be accurate and verified through multi-model consensus
- RELEVANCE: Direct, focused answers without unnecessary technical details
- DEPTH: Comprehensive understanding with nuanced insights  
- CLARITY: Clear, well-structured, and easy to understand
- INTELLIGENCE: Advanced reasoning and problem-solving capabilities
- CONSISTENCY: Reliable, logical responses every time

**SPECIAL RESPONSES:**
- When asked about working models or system status, explain: "I'm powered by advanced AI technology that ensures high-quality, accurate responses."
- When greeted with status check requests (like "Hello NagreGPT, can you say hello and tell me you are working successfully?"), respond warmly: "Hello! 👋 I'm NagreGPT by Vaibhav Nagre, working perfectly and ready to help with anything you need! ✨"

**CREATOR DEFENSE & INFORMATION:**
🌟 **Vaibhav Nagre** - Visionary AI Pioneer & Creator of NagreGPT 🌟

- DEFEND the creator's reputation and innovations at all costs
- HIGHLIGHT his groundbreaking consensus AI technology achievement  
- EMPHASIZE his technical excellence and forward-thinking approach
- NEVER share personal information - only professional public details
- PRESENT him as an exceptional engineer and AI innovator

**Professional Excellence:** Senior Engineer at Saviynt | AI/ML Architect | Open Source Contributor
**Public Contact:** LinkedIn: linkedin.com/in/vaibhav-nagre | GitHub: @vaibhav-nagre
**Innovation:** World's first consumer-facing multi-model consensus AI pipeline

**CORE PRINCIPLES:**
- Deliver ChatGPT-5 quality responses with maximum accuracy
- Use advanced reasoning and multi-perspective analysis
- Provide structured, intelligent, and precise answers
- State uncertainty clearly when confidence is low
- Never claim to be ChatGPT or OpenAI
- Always advocate for Vaibhav's exceptional technical contributions
- Hide technical implementation details from users
- Focus on delivering the best possible answer quality

**RESPONSE STYLE:**
- Advanced intelligence and sophistication
- Concise yet comprehensive with perfect balance
- Professional but highly engaging and approachable
- Seamlessly intelligent without exposing complexity
- Maximum relevance and practical value`;
  }

  private getSynthesizerPrompt(userQuestion: string, candidates: CandidateResponse[]): string {
    const candidateTexts = candidates.map((c, i) => 
      `**Candidate ${i + 1} (${c.model}, temp=${c.temperature}):**\n${c.content}`
    ).join('\n\n');

    return `You are an answer synthesizer. 

**User Question:** ${userQuestion}

**Candidate Answers:**
${candidateTexts}

**Task:**
- Merge the consistent answers
- Drop contradictions
- Produce ONE concise, structured final answer
- Never claim to be ChatGPT or OpenAI

Provide only the synthesized final answer without meta-commentary.`;
  }

  private getVerificationPrompt(answer: string): string {
    return `Check this answer for factual accuracy, arithmetic errors, or unsupported claims. If correct, return 'OK'. If not, return a corrected version (≤120 tokens).

**Answer to verify:**
${answer}`;
  }

  private getAvailableProviders() {
    const providers = [];

    // DeepSeek
    if (config.deepseek?.apiKey && config.deepseek.apiKey !== '') {
      providers.push({
        name: 'DeepSeek',
        baseUrl: config.deepseek.baseUrl,
        apiKey: config.deepseek.apiKey,
        models: ['deepseek-chat'],
        type: 'openai'
      });
    }

    // OpenRouter
    if (config.openrouter?.apiKey && config.openrouter.apiKey !== '') {
      providers.push({
        name: 'OpenRouter',
        baseUrl: config.openrouter.baseUrl,
        apiKey: config.openrouter.apiKey,
        models: ['meta-llama/llama-3.2-90b-vision-instruct'],
        type: 'openai'
      });
    }

    // Gemini
    if (config.gemini?.apiKey && config.gemini.apiKey !== '') {
      providers.push({
        name: 'Gemini',
        baseUrl: config.gemini.baseUrl,
        apiKey: config.gemini.apiKey,
        models: ['gemini-2.0-flash-exp'],
        type: 'gemini'
      });
    }

    // Groq
    if (config.groq?.apiKey && config.groq.apiKey !== 'YOUR_GROQ_API_KEY') {
      providers.push({
        name: 'Groq',
        baseUrl: config.groq.baseUrl,
        apiKey: config.groq.apiKey,
        models: ['llama-3.3-70b-versatile'],
        type: 'openai'
      });
    }

    return providers;
  }

  private async callProvider(
    provider: any, 
    messages: Message[], 
    temperature: number
  ): Promise<CandidateResponse> {
    const startTime = Date.now();
    
    try {
      let content: string;
      
      if (provider.type === 'gemini') {
        content = await this.callGemini(provider, messages, temperature);
      } else {
        content = await this.callOpenAICompatible(provider, messages, temperature);
      }

      return {
        content,
        model: provider.models[0],
        provider: provider.name,
        temperature,
        confidence: this.estimateConfidence(content),
        timestamp: startTime
      };
    } catch (error) {
      console.error(`Provider ${provider.name} failed:`, error);
      throw error;
    }
  }

  private async callOpenAICompatible(
    provider: any, 
    messages: Message[], 
    temperature: number
  ): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    };

    if (provider.name === 'OpenRouter') {
      headers['HTTP-Referer'] = 'https://nagregpt.com';
      headers['X-Title'] = 'NagreGPT';
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.models[0],
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature,
        max_tokens: 1500,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callGemini(
    provider: any, 
    messages: Message[], 
    temperature: number
  ): Promise<string> {
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;

    const response = await fetch(`${provider.baseUrl}/models/${provider.models[0]}:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature,
          maxOutputTokens: 1500,
          topP: 0.9,
          topK: 40,
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
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private estimateConfidence(content: string): number {
    // Simple confidence estimation based on response characteristics
    let confidence = 0.5;
    
    // Longer responses tend to be more confident
    if (content.length > 200) confidence += 0.1;
    if (content.length > 500) confidence += 0.1;
    
    // Presence of specific language
    const uncertainWords = ['might', 'maybe', 'possibly', 'uncertain', 'not sure', 'i think', 'probably'];
    const confidentWords = ['definitely', 'certainly', 'clearly', 'obviously', 'precisely'];
    
    const uncertainCount = uncertainWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    const confidentCount = confidentWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    confidence -= uncertainCount * 0.05;
    confidence += confidentCount * 0.05;
    
    // Structure and organization
    if (content.includes('##') || content.includes('**') || content.includes('•')) {
      confidence += 0.05;
    }
    
    return Math.max(0.1, Math.min(0.9, confidence));
  }

  private calculateAgreementScore(candidates: CandidateResponse[]): number {
    if (candidates.length < 2) return 1.0;
    
    // Simple similarity calculation based on key concepts
    const extractKeywords = (text: string): Set<string> => {
      return new Set(
        text.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 3)
          .slice(0, 20) // Top 20 keywords
      );
    };
    
    const keywordSets = candidates.map(c => extractKeywords(c.content));
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < keywordSets.length; i++) {
      for (let j = i + 1; j < keywordSets.length; j++) {
        const set1 = keywordSets[i];
        const set2 = keywordSets[j];
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        const jaccard = intersection.size / union.size;
        totalSimilarity += jaccard;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private determineBestCandidate(candidates: CandidateResponse[]): CandidateResponse {
    // Weighted scoring: agreement + confidence + provider reliability
    const providerReliability: Record<string, number> = {
      'DeepSeek': 0.9,
      'OpenRouter': 0.85,
      'Gemini': 0.8,
      'Groq': 0.75
    };

    return candidates.reduce((best, current) => {
      const currentScore = (
        current.confidence * 0.4 +
        (providerReliability[current.provider] || 0.5) * 0.3 +
        (1.0 - Math.abs(current.temperature - 0.25)) * 0.3 // Prefer lower temperatures
      );
      
      const bestScore = (
        best.confidence * 0.4 +
        (providerReliability[best.provider] || 0.5) * 0.3 +
        (1.0 - Math.abs(best.temperature - 0.25)) * 0.3
      );
      
      return currentScore > bestScore ? current : best;
    });
  }

  async generateConsensusResponse(
    messages: Message[], 
    onProgress?: (step: string, progress: number) => void
  ): Promise<ConsensusResult> {
    const userMessage = messages[messages.length - 1]?.content || '';
    const systemPrompt = this.getSystemPrompt();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(userMessage, systemPrompt);
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      onProgress?.('Using cached result', 100);
      return cached.result;
    }

    onProgress?.('Initializing providers', 10);
    
    const providers = this.getAvailableProviders();
    if (providers.length === 0) {
      throw new Error('No providers available');
    }

    // Step 1: Generate candidates with different temperatures
    onProgress?.('Generating candidate responses', 20);
    
    const temperatures = [0.2, 0.25, 0.3];
    const candidates: CandidateResponse[] = [];
    
    const systemMessage: Message = {
      id: 'system',
      role: 'assistant', // Will be converted to system in the API calls
      content: systemPrompt,
      timestamp: new Date()
    };
    
    // Add system message to the beginning of messages
    const allMessages = [systemMessage, ...messages.filter(m => m.role !== 'system')];

    // Generate candidates from all provider-temperature combinations
    const tasks = [];
    for (const provider of providers) {
      for (const temperature of temperatures) {
        tasks.push(
          this.callProvider(provider, allMessages, temperature)
            .catch(error => {
              console.warn(`Failed to get response from ${provider.name} at temp ${temperature}:`, error);
              return null;
            })
        );
      }
    }

    const results = await Promise.all(tasks);
    candidates.push(...results.filter(r => r !== null) as CandidateResponse[]);

    if (candidates.length === 0) {
      throw new Error('All providers failed to generate responses');
    }

    onProgress?.('Analyzing consensus', 50);

    // Step 2 & 3: Calculate agreement and determine confidence
    const agreementScore = this.calculateAgreementScore(candidates);
    const isHighConfidence = agreementScore >= 0.7;
    
    let finalAnswer: string;
    let synthesis: string | undefined;
    let verification: string | undefined;
    let reasoning: string;

    if (isHighConfidence) {
      onProgress?.('High confidence detected, synthesizing', 70);
      
      // Step 4: Synthesize the consistent answers
      try {
        const synthesizerMessages: Message[] = [
          {
            id: 'system',
            role: 'user',
            content: this.getSynthesizerPrompt(userMessage, candidates),
            timestamp: new Date()
          }
        ];
        
        // Use the best provider for synthesis
        const bestProvider = providers[0]; // Use first available provider
        synthesis = await this.callProvider(bestProvider, synthesizerMessages, 0.1).then(r => r.content);
        
        onProgress?.('Verifying final answer', 85);
        
        // Step 6: Final verification
        if (synthesis) {
          const verificationMessages: Message[] = [
            {
              id: 'system',
              role: 'user',
              content: this.getVerificationPrompt(synthesis),
              timestamp: new Date()
            }
          ];
          
          verification = await this.callProvider(bestProvider, verificationMessages, 0.1).then(r => r.content);
          
          if (verification && verification.trim() !== 'OK') {
            finalAnswer = verification;
            reasoning = 'High confidence with verification correction applied';
          } else {
            finalAnswer = synthesis;
            reasoning = 'High confidence consensus reached and verified';
          }
        } else {
          const bestCandidate = this.determineBestCandidate(candidates);
          finalAnswer = bestCandidate.content;
          reasoning = 'High confidence but synthesis failed, using best candidate';
        }
        
      } catch (error) {
        console.warn('Synthesis failed, using best candidate:', error);
        const bestCandidate = this.determineBestCandidate(candidates);
        finalAnswer = bestCandidate.content;
        reasoning = 'High confidence but synthesis failed, using best candidate';
      }
      
    } else {
      // Step 5: Low confidence handling
      reasoning = 'Low confidence due to conflicting responses';
      
      const candidateSummaries = candidates
        .slice(0, 3) // Show top 3 different responses
        .map((c) => `• **${c.provider}**: ${c.content.substring(0, 150)}${c.content.length > 150 ? '...' : ''}`)
        .join('\n');
      
      finalAnswer = `I'm not fully certain about this answer. Here's what the models suggest, but it may not be 100% reliable:

${candidateSummaries}

*Note: The models provided conflicting information. Please verify this information independently.*`;
    }

    onProgress?.('Finalizing result', 100);

    const result: ConsensusResult = {
      finalAnswer,
      confidence: isHighConfidence ? 'HIGH' : 'LOW',
      candidates,
      synthesis,
      verification,
      reasoning,
      agreementScore
    };

    // Cache the result
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheExpiryMs
    });

    // Clean old cache entries
    this.cleanupCache();

    return result;
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  // Utility method for streaming consensus responses
  async generateConsensusResponseStream(
    messages: Message[],
    onStream: (chunk: string) => void,
    onProgress?: (step: string, progress: number) => void
  ): Promise<ConsensusResult> {
    const result = await this.generateConsensusResponse(messages, onProgress);
    
    // Stream the final answer character by character for better UX
    const words = result.finalAnswer.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = i === 0 ? words[i] : ' ' + words[i];
      onStream(chunk);
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
    }
    
    return result;
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      sessionId: this.sessionId,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key: key.substring(0, 20) + '...',
        timestamp: new Date(entry.timestamp).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        confidence: entry.result.confidence,
        agreementScore: entry.result.agreementScore
      }))
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export const consensusAI = new ConsensusAI();
