import { memorySystem } from './memorySystem';
import type { Message } from '../types';

interface LearningEvent {
  id: string;
  type: 'positive_feedback' | 'negative_feedback' | 'correction' | 'preference' | 'success' | 'failure';
  context: string;
  response: string;
  userReaction: 'helpful' | 'not_helpful' | 'partially_helpful' | 'perfect' | 'needs_improvement';
  timestamp: Date;
  conversationId: string;
  userId: string;
  improvementArea?: string;
}

interface LearningPattern {
  pattern: string;
  confidence: number;
  examples: string[];
  successRate: number;
  lastUsed: Date;
}

interface ResponseOptimization {
  originalResponse: string;
  optimizedResponse: string;
  improvementType: 'clarity' | 'accuracy' | 'helpfulness' | 'formatting' | 'tone';
  confidenceScore: number;
}

/**
 * Revolutionary Real-Time Learning System
 * Makes NagreGPT continuously improve from every interaction
 */
export class RealTimeLearning {
  private learningEvents: Map<string, LearningEvent[]> = new Map();
  private learningPatterns: Map<string, LearningPattern[]> = new Map();
  private responseOptimizations: Map<string, ResponseOptimization[]> = new Map();
  private feedbackQueue: LearningEvent[] = [];
  private isLearning = true;

  constructor() {
    this.loadLearningData();
    this.setupRealTimeLearning();
  }

  /**
   * Record user feedback for continuous learning
   */
  recordFeedback(
    userId: string,
    conversationId: string,
    response: string,
    userReaction: LearningEvent['userReaction'],
    context: string,
    improvementArea?: string
  ): void {
    const event: LearningEvent = {
      id: `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.classifyFeedbackType(userReaction),
      context,
      response,
      userReaction,
      timestamp: new Date(),
      conversationId,
      userId,
      improvementArea
    };

    // Store event
    const userEvents = this.learningEvents.get(userId) || [];
    userEvents.push(event);
    this.learningEvents.set(userId, userEvents);

    // Add to processing queue
    this.feedbackQueue.push(event);

    // Trigger immediate learning if negative feedback
    if (userReaction === 'not_helpful' || userReaction === 'needs_improvement') {
      this.processImmediateLearning(event);
    }

    this.saveLearningData();
  }

  /**
   * Get real-time response optimization suggestions
   */
  optimizeResponse(
    originalResponse: string,
    _context: string,
    userId: string
  ): ResponseOptimization | null {
    const userEvents = this.learningEvents.get(userId) || [];
    const userPatterns = this.learningPatterns.get(userId) || [];

    // Analyze recent negative feedback
    const recentNegativeFeedback = userEvents
      .filter(event => 
        event.userReaction === 'not_helpful' || 
        event.userReaction === 'needs_improvement'
      )
      .slice(-5); // Last 5 negative feedbacks

    if (recentNegativeFeedback.length === 0) {
      return null;
    }

    // Find common issues
    const commonIssues = this.identifyCommonIssues(recentNegativeFeedback);
    const optimization = this.generateOptimization(originalResponse, commonIssues, userPatterns);

    if (optimization) {
      // Store optimization for future reference
      const userOptimizations = this.responseOptimizations.get(userId) || [];
      userOptimizations.push(optimization);
      this.responseOptimizations.set(userId, userOptimizations);
      this.saveLearningData();
    }

    return optimization;
  }

  /**
   * Learn from conversation patterns
   */
  learnFromConversation(
    userId: string,
    conversationId: string,
    messages: Message[],
    overallSatisfaction: 'excellent' | 'good' | 'average' | 'poor'
  ): void {
    const pattern = this.extractConversationPattern(messages);
    const learningInsight = this.generateLearningInsight(pattern, overallSatisfaction);

    if (learningInsight) {
      const userPatterns = this.learningPatterns.get(userId) || [];
      
      // Update existing pattern or add new one
      const existingPatternIndex = userPatterns.findIndex(p => p.pattern === learningInsight.pattern);
      if (existingPatternIndex >= 0) {
        userPatterns[existingPatternIndex] = {
          ...userPatterns[existingPatternIndex],
          confidence: Math.min(1, userPatterns[existingPatternIndex].confidence + 0.1),
          successRate: this.updateSuccessRate(
            userPatterns[existingPatternIndex].successRate,
            overallSatisfaction
          ),
          lastUsed: new Date()
        };
      } else {
        userPatterns.push(learningInsight);
      }

      this.learningPatterns.set(userId, userPatterns);
      
      // Store in memory system for long-term retention
      memorySystem.storeMemory(
        userId,
        `Learned pattern: ${learningInsight.pattern}`,
        `Success rate: ${learningInsight.successRate}, Confidence: ${learningInsight.confidence}`,
        'pattern',
        learningInsight.confidence,
        conversationId
      );
    }

    this.saveLearningData();
  }

  /**
   * Get personalized response guidelines based on learning
   */
  getPersonalizedGuidelines(userId: string): string {
    const userPatterns = this.learningPatterns.get(userId) || [];
    const userEvents = this.learningEvents.get(userId) || [];
    
    if (userPatterns.length === 0 && userEvents.length === 0) {
      return '';
    }

    let guidelines = '**PERSONALIZED RESPONSE GUIDELINES (Learned from interactions):**\n\n';

    // Add successful patterns
    const successfulPatterns = userPatterns
      .filter(pattern => pattern.successRate > 0.7)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    if (successfulPatterns.length > 0) {
      guidelines += '✅ **What works well for this user:**\n';
      successfulPatterns.forEach(pattern => {
        guidelines += `• ${pattern.pattern} (${Math.round(pattern.successRate * 100)}% success rate)\n`;
      });
      guidelines += '\n';
    }

    // Add improvement areas
    const recentNegativeFeedback = userEvents
      .filter(event => event.userReaction === 'not_helpful' || event.userReaction === 'needs_improvement')
      .slice(-3);

    if (recentNegativeFeedback.length > 0) {
      guidelines += '⚠️ **Areas to improve:**\n';
      const improvementAreas = [...new Set(recentNegativeFeedback
        .map(event => event.improvementArea)
        .filter(area => area))];
      
      improvementAreas.forEach(area => {
        guidelines += `• Avoid ${area}\n`;
      });
      guidelines += '\n';
    }

    // Add learned preferences
    const preferences = this.extractLearnedPreferences(userEvents);
    if (preferences.length > 0) {
      guidelines += '🎯 **User preferences (learned):**\n';
      preferences.forEach(pref => {
        guidelines += `• ${pref}\n`;
      });
      guidelines += '\n';
    }

    return guidelines;
  }

  /**
   * Get learning analytics for the user
   */
  getLearningAnalytics(userId: string): {
    totalInteractions: number;
    learningProgress: number;
    strongAreas: string[];
    improvementAreas: string[];
    learningTrends: {
      helpfulnessScore: number;
      responseQuality: number;
      userSatisfaction: number;
    };
  } {
    const userEvents = this.learningEvents.get(userId) || [];
    const userPatterns = this.learningPatterns.get(userId) || [];

    const helpfulResponses = userEvents.filter(e => 
      e.userReaction === 'helpful' || e.userReaction === 'perfect'
    ).length;

    const totalResponses = userEvents.length;
    const helpfulnessScore = totalResponses > 0 ? helpfulResponses / totalResponses : 0;

    return {
      totalInteractions: totalResponses,
      learningProgress: Math.min(1, userPatterns.length / 10), // Progress based on learned patterns
      strongAreas: userPatterns
        .filter(p => p.successRate > 0.8)
        .map(p => p.pattern)
        .slice(0, 3),
      improvementAreas: this.getTopImprovementAreas(userEvents),
      learningTrends: {
        helpfulnessScore,
        responseQuality: this.calculateResponseQuality(userEvents),
        userSatisfaction: this.calculateUserSatisfaction(userEvents)
      }
    };
  }

  /**
   * Process learning queue in real-time
   */
  private setupRealTimeLearning(): void {
    setInterval(() => {
      if (this.feedbackQueue.length > 0 && this.isLearning) {
        this.processFeedbackQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  private processFeedbackQueue(): void {
    const batchSize = Math.min(10, this.feedbackQueue.length);
    const batch = this.feedbackQueue.splice(0, batchSize);

    batch.forEach(event => {
      this.processLearningEvent(event);
    });
  }

  private processLearningEvent(event: LearningEvent): void {
    // Extract learning insights from the event
    if (event.userReaction === 'helpful' || event.userReaction === 'perfect') {
      this.reinforceSuccessfulResponse(event);
    } else if (event.userReaction === 'not_helpful' || event.userReaction === 'needs_improvement') {
      this.analyzeFailedResponse(event);
    }
  }

  private processImmediateLearning(event: LearningEvent): void {
    // Immediate learning for negative feedback
    const issue = this.identifyImmediateIssue(event);
    if (issue) {
      // Store as high-priority learning
      memorySystem.storeMemory(
        event.userId,
        `Avoid: ${issue}`,
        `User reaction: ${event.userReaction}, Context: ${event.context}`,
        'preference',
        0.9, // High importance
        event.conversationId
      );
    }
  }

  private classifyFeedbackType(reaction: LearningEvent['userReaction']): LearningEvent['type'] {
    switch (reaction) {
      case 'helpful':
      case 'perfect':
        return 'positive_feedback';
      case 'not_helpful':
      case 'needs_improvement':
        return 'negative_feedback';
      case 'partially_helpful':
        return 'preference';
      default:
        return 'positive_feedback';
    }
  }

  private identifyCommonIssues(negativeEvents: LearningEvent[]): string[] {
    const issues = negativeEvents
      .map(event => event.improvementArea)
      .filter(area => area) as string[];

    // Count frequency of issues
    const issueCounts = new Map<string, number>();
    issues.forEach(issue => {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    });

    // Return most common issues
    return Array.from(issueCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue);
  }

  private generateOptimization(
    originalResponse: string,
    commonIssues: string[],
    _userPatterns: LearningPattern[]
  ): ResponseOptimization | null {
    if (commonIssues.length === 0) return null;

    // Simple optimization logic (enhance with AI in production)
    const mainIssue = commonIssues[0];
    let optimizedResponse = originalResponse;
    let improvementType: ResponseOptimization['improvementType'] = 'helpfulness';

    // Apply optimizations based on common issues
    if (mainIssue.includes('too long')) {
      optimizedResponse = this.shortenResponse(originalResponse);
      improvementType = 'clarity';
    } else if (mainIssue.includes('too technical')) {
      optimizedResponse = this.simplifyResponse(originalResponse);
      improvementType = 'clarity';
    } else if (mainIssue.includes('not specific')) {
      optimizedResponse = this.addSpecificity(originalResponse);
      improvementType = 'accuracy';
    }

    return {
      originalResponse,
      optimizedResponse,
      improvementType,
      confidenceScore: 0.7
    };
  }

  private extractConversationPattern(messages: Message[]): string {
    // Simple pattern extraction (enhance with ML in production)
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    if (userMessages.length === 0) return '';

    const avgUserLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const avgAssistantLength = assistantMessages.reduce((sum, m) => sum + m.content.length, 0) / assistantMessages.length;

    if (avgUserLength < 50 && avgAssistantLength > 200) {
      return 'User prefers brief questions with detailed responses';
    } else if (avgUserLength > 200 && avgAssistantLength < 100) {
      return 'User provides detailed context but wants concise answers';
    } else if (userMessages.some(m => m.content.includes('code'))) {
      return 'User frequently asks for coding help';
    }

    return 'Standard conversational pattern';
  }

  private generateLearningInsight(
    pattern: string,
    satisfaction: 'excellent' | 'good' | 'average' | 'poor'
  ): LearningPattern | null {
    if (!pattern || pattern === '') return null;

    const successRate = satisfaction === 'excellent' ? 1 :
                       satisfaction === 'good' ? 0.8 :
                       satisfaction === 'average' ? 0.6 : 0.3;

    return {
      pattern,
      confidence: 0.5,
      examples: [],
      successRate,
      lastUsed: new Date()
    };
  }

  private updateSuccessRate(currentRate: number, satisfaction: string): number {
    const newRate = satisfaction === 'excellent' ? 1 :
                   satisfaction === 'good' ? 0.8 :
                   satisfaction === 'average' ? 0.6 : 0.3;
    
    // Weighted average with recent results having more impact
    return (currentRate * 0.7) + (newRate * 0.3);
  }

  private extractLearnedPreferences(events: LearningEvent[]): string[] {
    const positiveEvents = events.filter(e => 
      e.userReaction === 'helpful' || e.userReaction === 'perfect'
    );

    // Analyze successful interactions for patterns
    const preferences: string[] = [];
    
    if (positiveEvents.some(e => e.response.includes('```'))) {
      preferences.push('Appreciates code examples');
    }
    
    if (positiveEvents.some(e => e.response.length < 200)) {
      preferences.push('Prefers concise responses');
    }
    
    if (positiveEvents.some(e => e.response.includes('•') || e.response.includes('-'))) {
      preferences.push('Likes structured, bullet-point format');
    }

    return preferences;
  }

  private getTopImprovementAreas(events: LearningEvent[]): string[] {
    const negativeEvents = events.filter(e => 
      e.userReaction === 'not_helpful' || e.userReaction === 'needs_improvement'
    );

    const areas = negativeEvents
      .map(e => e.improvementArea)
      .filter(area => area) as string[];

    const areaCounts = new Map<string, number>();
    areas.forEach(area => {
      areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
    });

    return Array.from(areaCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([area]) => area);
  }

  private calculateResponseQuality(events: LearningEvent[]): number {
    if (events.length === 0) return 0;

    const qualityScores = events.map(e => {
      switch (e.userReaction) {
        case 'perfect': return 1.0;
        case 'helpful': return 0.8;
        case 'partially_helpful': return 0.6;
        case 'needs_improvement': return 0.3;
        case 'not_helpful': return 0.1;
        default: return 0.5;
      }
    });

    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  private calculateUserSatisfaction(events: LearningEvent[]): number {
    // Similar to response quality but weighted by recency
    if (events.length === 0) return 0;

    const recentEvents = events.slice(-10); // Last 10 interactions
    return this.calculateResponseQuality(recentEvents);
  }

  private reinforceSuccessfulResponse(event: LearningEvent): void {
    // Store successful patterns for replication
    memorySystem.storeMemory(
      event.userId,
      `Successful response pattern: ${event.response.substring(0, 100)}...`,
      `User reaction: ${event.userReaction}, Context: ${event.context}`,
      'pattern',
      0.8,
      event.conversationId
    );
  }

  private analyzeFailedResponse(event: LearningEvent): void {
    // Identify what went wrong and how to improve
    const issue = event.improvementArea || 'General improvement needed';
    
    memorySystem.storeMemory(
      event.userId,
      `Failed response - avoid: ${issue}`,
      `Context: ${event.context}, User reaction: ${event.userReaction}`,
      'preference',
      0.9, // High importance for failures
      event.conversationId
    );
  }

  private identifyImmediateIssue(event: LearningEvent): string | null {
    if (event.improvementArea) {
      return event.improvementArea;
    }

    // Analyze response for common issues
    if (event.response.length > 1000) {
      return 'Response too long';
    }
    
    if (event.response.split('```').length > 3) {
      return 'Too many code blocks';
    }

    return 'General response quality';
  }

  // Simple response optimization methods
  private shortenResponse(response: string): string {
    const sentences = response.split('. ');
    if (sentences.length <= 3) return response;
    
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private simplifyResponse(response: string): string {
    // Replace technical terms with simpler alternatives
    return response
      .replace(/implementation/g, 'way to do it')
      .replace(/optimization/g, 'improvement')
      .replace(/algorithm/g, 'method');
  }

  private addSpecificity(response: string): string {
    // Add more specific examples and details
    if (!response.includes('example')) {
      return response + '\n\nFor example: [specific example would be added here]';
    }
    return response;
  }

  private loadLearningData(): void {
    try {
      const eventsData = localStorage.getItem('nagregpt_learning_events');
      const patternsData = localStorage.getItem('nagregpt_learning_patterns');
      const optimizationsData = localStorage.getItem('nagregpt_optimizations');

      if (eventsData) {
        const parsed = JSON.parse(eventsData);
        this.learningEvents = new Map(Object.entries(parsed));
      }

      if (patternsData) {
        const parsed = JSON.parse(patternsData);
        this.learningPatterns = new Map(Object.entries(parsed));
      }

      if (optimizationsData) {
        const parsed = JSON.parse(optimizationsData);
        this.responseOptimizations = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load learning data:', error);
    }
  }

  private saveLearningData(): void {
    try {
      const eventsObj = Object.fromEntries(this.learningEvents);
      const patternsObj = Object.fromEntries(this.learningPatterns);
      const optimizationsObj = Object.fromEntries(this.responseOptimizations);
      
      localStorage.setItem('nagregpt_learning_events', JSON.stringify(eventsObj));
      localStorage.setItem('nagregpt_learning_patterns', JSON.stringify(patternsObj));
      localStorage.setItem('nagregpt_optimizations', JSON.stringify(optimizationsObj));
    } catch (error) {
      console.warn('Failed to save learning data:', error);
    }
  }

  /**
   * Get system learning statistics
   */
  getLearningStats() {
    const totalEvents = Array.from(this.learningEvents.values())
      .reduce((sum, events) => sum + events.length, 0);
    
    const totalPatterns = Array.from(this.learningPatterns.values())
      .reduce((sum, patterns) => sum + patterns.length, 0);

    return {
      totalUsers: this.learningEvents.size,
      totalLearningEvents: totalEvents,
      totalLearnedPatterns: totalPatterns,
      averageUserSatisfaction: this.calculateGlobalSatisfaction(),
      isActiveLearning: this.isLearning
    };
  }

  private calculateGlobalSatisfaction(): number {
    const allEvents = Array.from(this.learningEvents.values()).flat();
    return this.calculateResponseQuality(allEvents);
  }

  /**
   * Toggle learning mode
   */
  setLearningMode(enabled: boolean): void {
    this.isLearning = enabled;
  }
}

export const realTimeLearning = new RealTimeLearning();
