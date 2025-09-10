import { consensusAI, type ConsensusResult } from './consensusAI';
import { latest2025AI } from './latest2025AI';
import { intelligentAgent } from './intelligentAgent';
import { memorySystem } from './memorySystem';
import { realTimeLearning } from './realTimeLearning';
import { advancedReasoning } from './advancedReasoning';
import { webIntegration } from './webIntegration';
import type { Message } from '../types';

export interface MultiModelResponse {
  content: string;
  model: string;
  provider: string;
  consensus?: ConsensusResult;
  usedConsensus: boolean;
  confidence: 'HIGH' | 'LOW' | 'UNKNOWN';
  processingTime: number;
  reasoning?: any;
  personalizedContext?: string;
  learningInsights?: any;
  webEnhancement?: {
    sources: any[];
    news: any[];
    factChecks: any[];
  };
}

class MultiModelAPI {
  private useConsensus: boolean = false; // Temporarily disabled for debugging
  private fallbackToSingle: boolean = true;
  private useIntelligentRouting: boolean = false; // Temporarily disabled for debugging
  private useMemory: boolean = false; // Temporarily disabled for debugging
  private useLearning: boolean = false; // Temporarily disabled for debugging
  private useAdvancedReasoning: boolean = false; // Temporarily disabled for debugging
  private useWebIntegration: boolean = true; // Enable Google search and live data

  constructor() {
    // Initialize with consensus enabled by default
  }

  /**
   * Enable or disable consensus mode
   */
  setConsensusMode(enabled: boolean) {
    this.useConsensus = enabled;
  }

  /**
   * Enable or disable fallback to single model
   */
  setFallbackMode(enabled: boolean) {
    this.fallbackToSingle = enabled;
  }

  /**
   * Configure intelligence features
   */
  setIntelligenceFeatures(config: {
    intelligentRouting?: boolean;
    memory?: boolean;
    learning?: boolean;
    advancedReasoning?: boolean;
  }) {
    if (config.intelligentRouting !== undefined) this.useIntelligentRouting = config.intelligentRouting;
    if (config.memory !== undefined) this.useMemory = config.memory;
    if (config.learning !== undefined) this.useLearning = config.learning;
    if (config.advancedReasoning !== undefined) this.useAdvancedReasoning = config.advancedReasoning;
  }

    /**
   * Search Google for live information
   */
  async searchGoogle(
    query: string,
    options?: {
      type?: 'general' | 'news' | 'academic' | 'technical';
      timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
    }
  ) {
    try {
      const results = await webIntegration.searchWeb(query, options);
      return {
        success: true,
        results,
        query,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Google search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
        query,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get live data including Google search, news, and trending topics
   */
  async getLiveInformation(query: string) {
    try {
      const liveData = await webIntegration.getLiveData(query);
      return {
        success: true,
        ...liveData,
        query,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get live information:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get live data',
        searchResults: [],
        relatedQueries: [],
        trending: [],
        quickAnswers: [],
        query,
        timestamp: new Date()
      };
    }
  }

  /**
   * Record user feedback for learning system
   */
  recordUserFeedback(
    userId: string,
    conversationId: string,
    response: string,
    userReaction: 'helpful' | 'not_helpful' | 'partially_helpful' | 'perfect' | 'needs_improvement',
    context: string,
    improvementArea?: string
  ) {
    if (this.useLearning) {
      realTimeLearning.recordFeedback(
        userId,
        conversationId,
        response,
        userReaction,
        context,
        improvementArea
      );
    }
  }

  /**
   * Get personalized insights for a user
   */
  getUserInsights(userId: string) {
    return {
      memory: this.useMemory ? memorySystem.getLearningInsights(userId) : null,
      learning: this.useLearning ? realTimeLearning.getLearningAnalytics(userId) : null,
      intelligence: intelligentAgent.getIntelligenceMetrics()
    };
  }

  /**
   * Send message with full intelligence suite
   */
  async sendMessage(
    messages: Message[], 
    onStream?: (chunk: string) => void,
    onProgress?: (step: string, progress: number) => void,
    userId: string = 'default_user'
  ): Promise<MultiModelResponse> {
    const startTime = Date.now();
    let personalizedContext = '';
    let reasoning = null;
    let learningInsights = null;

    console.log('🧠 MultiModelAPI.sendMessage called', { 
      messageCount: messages.length, 
      userId, 
      hasStream: !!onStream,
      useConsensus: this.useConsensus,
      useIntelligentRouting: this.useIntelligentRouting 
    });

    try {
      // Step 1: Get personalized context from memory
      if (this.useMemory) {
        onProgress?.('Loading personalized context', 5);
        personalizedContext = memorySystem.getPersonalizedContext(userId);
        
        // Store conversation context in memory
        const userMessage = messages[messages.length - 1];
        if (userMessage) {
          await memorySystem.storeMemory(
            userId,
            userMessage.content,
            'User query in conversation',
            'context',
            0.6
          );
        }
      }

      // Step 2: Analyze task for intelligent routing
      let taskAnalysis = null;
      if (this.useIntelligentRouting) {
        onProgress?.('Analyzing task complexity', 10);
        taskAnalysis = intelligentAgent.analyzeTask(
          messages[messages.length - 1]?.content || '',
          messages
        );
      }

      // Step 3: Perform advanced reasoning for complex queries
      if (this.useAdvancedReasoning && taskAnalysis?.complexity === 'expert') {
        onProgress?.('Performing advanced reasoning', 15);
        reasoning = await advancedReasoning.performReasoning(
          messages[messages.length - 1]?.content || '',
          messages,
          taskAnalysis.complexity
        );
      }

      // Step 4: Add personalized context to messages
      const enhancedMessages = [...messages];
      if (personalizedContext) {
        const systemMessage = enhancedMessages.find(m => m.role === 'system');
        if (systemMessage) {
          systemMessage.content = personalizedContext + systemMessage.content;
        } else {
          enhancedMessages.unshift({
            id: `sys_${Date.now()}`,
            role: 'system',
            content: personalizedContext,
            timestamp: new Date()
          });
        }
      }

      // Step 5: Add learning guidelines
      if (this.useLearning) {
        onProgress?.('Applying learned preferences', 20);
        const guidelines = realTimeLearning.getPersonalizedGuidelines(userId);
        if (guidelines) {
          const systemMessage = enhancedMessages.find(m => m.role === 'system');
          if (systemMessage) {
            systemMessage.content = guidelines + '\n\n' + systemMessage.content;
          }
        }
      }

      let result: MultiModelResponse;

      // Step 6: Use consensus or intelligent routing
      if (this.useConsensus && taskAnalysis?.complexity !== 'simple') {
        onProgress?.('Starting consensus analysis', 25);
        
        if (onStream) {
          const consensusResult = await consensusAI.generateConsensusResponseStream(
            enhancedMessages, 
            onStream, 
            onProgress
          );
          
          result = {
            content: consensusResult.finalAnswer,
            model: 'Consensus Model',
            provider: 'Multi-Provider',
            consensus: consensusResult,
            usedConsensus: true,
            confidence: consensusResult.confidence,
            processingTime: Date.now() - startTime,
            reasoning,
            personalizedContext,
            learningInsights
          };
        } else {
          const consensusResult = await consensusAI.generateConsensusResponse(
            enhancedMessages, 
            onProgress
          );
          
          result = {
            content: consensusResult.finalAnswer,
            model: 'Consensus Model',
            provider: 'Multi-Provider',
            consensus: consensusResult,
            usedConsensus: true,
            confidence: consensusResult.confidence,
            processingTime: Date.now() - startTime,
            reasoning,
            personalizedContext,
            learningInsights
          };
        }
      } else {
        // Use simple single model routing
        onProgress?.('Using single model', 25);
        
        console.log('🚀 Calling latest2025AI.sendMessage directly from multiModelAPI...');
        const singleResponse = await latest2025AI.sendMessage(enhancedMessages, onStream);
        console.log('✅ Single model response received:', { 
          hasContent: !!singleResponse.content,
          model: singleResponse.model,
          provider: singleResponse.provider 
        });
        
        result = {
          content: singleResponse.content,
          model: singleResponse.model,
          provider: singleResponse.provider,
          usedConsensus: false,
          confidence: 'UNKNOWN',
          processingTime: Date.now() - startTime,
          reasoning,
          personalizedContext,
          learningInsights
        };
      }

      // Step 7: Store successful interaction in memory
      if (this.useMemory && result.content) {
        await memorySystem.storeMemory(
          userId,
          result.content,
          'AI response - successful interaction',
          'context',
          result.confidence === 'HIGH' ? 0.8 : 0.6
        );
      }

      // Step 8: Enhance response with web integration and real-time data
      if (this.useWebIntegration) {
        onProgress?.('Gathering real-time information', 85);
        
        try {
          // Get live data and enhance the response
          const userQuery = messages[messages.length - 1]?.content || '';
          const enhancedResponse = await webIntegration.intelligentlyEnhanceResponse(
            result.content,
            userQuery,
            {
              includeNews: true,
              includeSearch: true,
              factCheck: true,
              seamlessIntegration: true
            }
          );
          
          result.content = enhancedResponse.enhancedContent;
          result.webEnhancement = {
            sources: enhancedResponse.sources,
            news: enhancedResponse.news,
            factChecks: enhancedResponse.factChecks
          };
        } catch (webError) {
          console.warn('Web enhancement failed:', webError);
          // Continue without web enhancement
        }
      }

      // Step 9: Get learning insights
      if (this.useLearning) {
        learningInsights = realTimeLearning.getLearningAnalytics(userId);
        result.learningInsights = learningInsights;
      }

      onProgress?.('Response complete', 100);
      return result;

    } catch (error) {
      console.warn('Enhanced processing failed, falling back:', error);
      console.log('🔄 Attempting fallback to single model...');
      
      if (this.fallbackToSingle) {
        onProgress?.('Falling back to basic model', 90);
        
        try {
          console.log('🚀 Calling latest2025AI.sendMessage directly...');
          const singleResponse = await latest2025AI.sendMessage(messages, onStream);
          console.log('✅ Fallback succeeded:', { 
            hasContent: !!singleResponse.content,
            model: singleResponse.model,
            provider: singleResponse.provider 
          });
          
          return {
            content: singleResponse.content,
            model: singleResponse.model,
            provider: singleResponse.provider,
            usedConsensus: false,
            confidence: 'LOW',
            processingTime: Date.now() - startTime,
            reasoning,
            personalizedContext,
            learningInsights
          };
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          const errorMsg = error instanceof Error ? error.message : String(error);
          const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          throw new Error(`All processing methods failed. Original error: ${errorMsg}. Fallback error: ${fallbackErrorMsg}`);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Get consensus statistics
   */
  getConsensusStats() {
    return consensusAI.getCacheStats();
  }

  /**
   * Clear consensus cache
   */
  clearConsensusCache() {
    consensusAI.clearCache();
  }

  /**
   * Check if consensus mode is available
   */
  isConsensusAvailable(): boolean {
    try {
      // Check if we have at least 2 providers available
      return latest2025AI.getAvailableProviders().length >= 2;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      consensusEnabled: this.useConsensus,
      fallbackEnabled: this.fallbackToSingle,
      consensusAvailable: this.isConsensusAvailable(),
      availableProviders: latest2025AI.getAvailableProviders(),
      cacheStats: this.getConsensusStats()
    };
  }
}

export const multiModelAPI = new MultiModelAPI();

// Export types for external use
export type { ConsensusResult } from './consensusAI';