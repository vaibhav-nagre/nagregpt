import type { Message } from '../types';

interface MemoryEntry {
  id: string;
  content: string;
  context: string;
  importance: number; // 0-1
  timestamp: Date;
  category: 'factual' | 'preference' | 'context' | 'skill' | 'pattern';
  userId?: string;
  conversationId?: string;
  embeddings?: number[]; // For semantic search
}

interface UserProfile {
  id: string;
  preferences: {
    communicationStyle: 'formal' | 'casual' | 'technical' | 'friendly';
    topicInterests: string[];
    expertiseLevel: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert'>;
    responseLength: 'brief' | 'moderate' | 'detailed';
    codeLanguages: string[];
  };
  learningPattern: {
    commonQuestions: string[];
    learningPath: string[];
    progressTracking: Record<string, number>;
  };
  conversationHistory: {
    totalMessages: number;
    avgSessionLength: number;
    favoriteTopics: string[];
    successfulInteractions: number;
  };
}

/**
 * Revolutionary Memory System - Makes NagreGPT remember and learn
 * First AI assistant with true long-term memory and user adaptation
 */
export class MemorySystem {
  private memories: Map<string, MemoryEntry[]> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private maxMemoriesPerUser = 1000;
  private memoryDecayRate = 0.95; // Memories slowly fade if not reinforced

  constructor() {
    this.loadFromStorage();
    this.setupPeriodicCleanup();
  }

  /**
   * Store important information from conversations
   */
  async storeMemory(
    userId: string,
    content: string,
    context: string,
    category: MemoryEntry['category'],
    importance: number = 0.5,
    conversationId?: string
  ): Promise<void> {
    const memory: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      context,
      importance: Math.max(0, Math.min(1, importance)),
      timestamp: new Date(),
      category,
      userId,
      conversationId,
      embeddings: await this.generateEmbeddings(content)
    };

    const userMemories = this.memories.get(userId) || [];
    userMemories.push(memory);

    // Keep only most important memories if limit exceeded
    if (userMemories.length > this.maxMemoriesPerUser) {
      userMemories.sort((a, b) => b.importance - a.importance);
      userMemories.splice(this.maxMemoriesPerUser);
    }

    this.memories.set(userId, userMemories);
    this.saveToStorage();
  }

  /**
   * Retrieve relevant memories for context
   */
  getRelevantMemories(userId: string, query: string, limit: number = 5): MemoryEntry[] {
    const userMemories = this.memories.get(userId) || [];
    
    // Simple relevance scoring (in production, use semantic embeddings)
    const scoredMemories = userMemories.map(memory => ({
      ...memory,
      relevanceScore: this.calculateRelevance(memory, query)
    }));

    return scoredMemories
      .filter(memory => memory.relevanceScore > 0.1)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Update user profile based on interactions
   */
  updateUserProfile(userId: string, updates: Partial<UserProfile>): void {
    const currentProfile = this.userProfiles.get(userId) || this.createDefaultProfile(userId);
    const updatedProfile = { ...currentProfile, ...updates };
    this.userProfiles.set(userId, updatedProfile);
    this.saveToStorage();
  }

  /**
   * Get personalized context for responses
   */
  getPersonalizedContext(userId: string): string {
    const profile = this.userProfiles.get(userId);
    const recentMemories = this.getRecentMemories(userId, 3);

    if (!profile && recentMemories.length === 0) {
      return '';
    }

    let context = '**PERSONALIZED CONTEXT:**\n';
    
    if (profile) {
      context += `• Communication Style: ${profile.preferences.communicationStyle}\n`;
      context += `• Response Length: ${profile.preferences.responseLength}\n`;
      if (profile.preferences.codeLanguages.length > 0) {
        context += `• Preferred Languages: ${profile.preferences.codeLanguages.join(', ')}\n`;
      }
      if (profile.preferences.topicInterests.length > 0) {
        context += `• Interests: ${profile.preferences.topicInterests.join(', ')}\n`;
      }
    }

    if (recentMemories.length > 0) {
      context += '\n**RECENT CONTEXT:**\n';
      recentMemories.forEach(memory => {
        context += `• ${memory.content}\n`;
      });
    }

    return context + '\n';
  }

  /**
   * Learn from successful interactions
   */
  reinforceMemory(userId: string, memoryId: string, reinforcement: number = 0.1): void {
    const userMemories = this.memories.get(userId) || [];
    const memory = userMemories.find(m => m.id === memoryId);
    
    if (memory) {
      memory.importance = Math.min(1, memory.importance + reinforcement);
      this.saveToStorage();
    }
  }

  /**
   * Analyze conversation patterns
   */
  analyzeConversationPattern(messages: Message[]): {
    topics: string[];
    complexity: 'simple' | 'medium' | 'complex';
    style: 'formal' | 'casual' | 'technical';
    intent: string;
  } {
    const allContent = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Extract topics (simplified - in production use NLP)
    const topics = this.extractTopics(allContent);
    
    // Determine complexity
    const complexity = allContent.length > 500 ? 'complex' : 
                      allContent.length > 200 ? 'medium' : 'simple';
    
    // Determine style
    const style = this.determineStyle(allContent);
    
    // Determine intent
    const intent = this.extractIntent(allContent);

    return { topics, complexity, style, intent };
  }

  /**
   * Get learning insights for the user
   */
  getLearningInsights(userId: string): {
    totalInteractions: number;
    learningProgress: string[];
    recommendedTopics: string[];
    strengthAreas: string[];
  } {
    const profile = this.userProfiles.get(userId);
    const memories = this.memories.get(userId) || [];

    return {
      totalInteractions: profile?.conversationHistory.totalMessages || 0,
      learningProgress: profile?.learningPattern.learningPath || [],
      recommendedTopics: this.getRecommendedTopics(memories),
      strengthAreas: this.getStrengthAreas(memories)
    };
  }

  // Private helper methods
  private async generateEmbeddings(text: string): Promise<number[]> {
    // Simplified embedding - in production use proper embedding models
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0);
    
    words.forEach((word) => {
      const hash = this.simpleHash(word);
      embedding[hash % 128] += 1;
    });
    
    return embedding;
  }

  private calculateRelevance(memory: MemoryEntry, query: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = memory.content.toLowerCase();
    
    // Simple keyword matching (upgrade to semantic similarity in production)
    const keywords = queryLower.split(/\s+/);
    const matches = keywords.filter(keyword => contentLower.includes(keyword)).length;
    
    const keywordScore = matches / keywords.length;
    const importanceScore = memory.importance;
    const recencyScore = this.getRecencyScore(memory.timestamp);
    
    return (keywordScore * 0.5 + importanceScore * 0.3 + recencyScore * 0.2);
  }

  private getRecencyScore(timestamp: Date): number {
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - (hoursSinceCreated / (24 * 7))); // Decays over a week
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      id: userId,
      preferences: {
        communicationStyle: 'friendly',
        topicInterests: [],
        expertiseLevel: {},
        responseLength: 'moderate',
        codeLanguages: []
      },
      learningPattern: {
        commonQuestions: [],
        learningPath: [],
        progressTracking: {}
      },
      conversationHistory: {
        totalMessages: 0,
        avgSessionLength: 0,
        favoriteTopics: [],
        successfulInteractions: 0
      }
    };
  }

  private getRecentMemories(userId: string, limit: number): MemoryEntry[] {
    const userMemories = this.memories.get(userId) || [];
    return userMemories
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private extractTopics(content: string): string[] {
    // Simplified topic extraction
    const topicKeywords = {
      'programming': ['code', 'programming', 'function', 'algorithm', 'javascript', 'python', 'react'],
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'neural network', 'model'],
      'web development': ['html', 'css', 'frontend', 'backend', 'website', 'web'],
      'data science': ['data', 'analysis', 'statistics', 'visualization', 'database'],
      'business': ['business', 'marketing', 'strategy', 'management', 'finance']
    };

    const foundTopics: string[] = [];
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        foundTopics.push(topic);
      }
    });

    return foundTopics;
  }

  private determineStyle(content: string): 'formal' | 'casual' | 'technical' {
    const formalWords = ['please', 'kindly', 'would', 'could', 'thank you'];
    const casualWords = ['hey', 'cool', 'awesome', 'yeah', 'ok'];
    const technicalWords = ['implementation', 'algorithm', 'function', 'parameter', 'optimization'];

    const formalScore = formalWords.filter(word => content.includes(word)).length;
    const casualScore = casualWords.filter(word => content.includes(word)).length;
    const technicalScore = technicalWords.filter(word => content.includes(word)).length;

    if (technicalScore > formalScore && technicalScore > casualScore) return 'technical';
    if (casualScore > formalScore) return 'casual';
    return 'formal';
  }

  private extractIntent(content: string): string {
    if (content.includes('how to') || content.includes('tutorial')) return 'learning';
    if (content.includes('help') || content.includes('problem')) return 'problem-solving';
    if (content.includes('explain') || content.includes('what is')) return 'explanation';
    if (content.includes('create') || content.includes('build')) return 'creation';
    return 'general';
  }

  private getRecommendedTopics(memories: MemoryEntry[]): string[] {
    const topicCounts = new Map<string, number>();
    
    memories.forEach(memory => {
      const topics = this.extractTopics(memory.content);
      topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  private getStrengthAreas(memories: MemoryEntry[]): string[] {
    const skillAreas = memories
      .filter(memory => memory.category === 'skill')
      .map(memory => memory.context);
    
    return [...new Set(skillAreas)].slice(0, 3);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private setupPeriodicCleanup(): void {
    // Clean up old, low-importance memories every hour
    setInterval(() => {
      this.performMemoryMaintenance();
    }, 60 * 60 * 1000); // 1 hour
  }

  private performMemoryMaintenance(): void {
    this.memories.forEach((userMemories, userId) => {
      // Apply decay to all memories
      userMemories.forEach(memory => {
        memory.importance *= this.memoryDecayRate;
      });

      // Remove very low importance memories
      const filteredMemories = userMemories.filter(memory => memory.importance > 0.1);
      this.memories.set(userId, filteredMemories);
    });

    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const memoriesData = localStorage.getItem('nagregpt_memories');
      const profilesData = localStorage.getItem('nagregpt_profiles');

      if (memoriesData) {
        const parsed = JSON.parse(memoriesData);
        this.memories = new Map(Object.entries(parsed));
      }

      if (profilesData) {
        const parsed = JSON.parse(profilesData);
        this.userProfiles = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load memory data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const memoriesObj = Object.fromEntries(this.memories);
      const profilesObj = Object.fromEntries(this.userProfiles);
      
      localStorage.setItem('nagregpt_memories', JSON.stringify(memoriesObj));
      localStorage.setItem('nagregpt_profiles', JSON.stringify(profilesObj));
    } catch (error) {
      console.warn('Failed to save memory data:', error);
    }
  }

  /**
   * Get memory system statistics
   */
  getMemoryStats() {
    const totalMemories = Array.from(this.memories.values())
      .reduce((sum, memories) => sum + memories.length, 0);
    
    return {
      totalUsers: this.userProfiles.size,
      totalMemories,
      avgMemoriesPerUser: Math.round(totalMemories / Math.max(1, this.userProfiles.size)),
      memoryCategories: this.getMemoryCategoryStats()
    };
  }

  private getMemoryCategoryStats() {
    const categories = new Map<string, number>();
    
    this.memories.forEach(userMemories => {
      userMemories.forEach(memory => {
        categories.set(memory.category, (categories.get(memory.category) || 0) + 1);
      });
    });

    return Object.fromEntries(categories);
  }
}

export const memorySystem = new MemorySystem();
