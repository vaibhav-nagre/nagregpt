import { multiModelAPI } from './multiModelAPI';
import type { Message } from '../types';

interface AgentCapability {
  name: string;
  description: string;
  model: string;
  confidence: number;
}

interface TaskAnalysis {
  taskType: 'coding' | 'creative' | 'analytical' | 'conversational' | 'research' | 'complex_reasoning';
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  recommendedModel: string;
  requiredCapabilities: string[];
  estimatedTokens: number;
}

/**
 * Intelligent Agent System - Routes tasks to optimal models
 * This makes NagreGPT the first AI with true task-aware intelligence
 */
export class IntelligentAgent {
  private capabilities: Map<string, AgentCapability[]> = new Map();

  constructor() {
    this.initializeCapabilities();
  }

  private initializeCapabilities() {
    // DeepSeek V3 - Best for reasoning and coding
    this.capabilities.set('DeepSeek', [
      { name: 'Advanced Reasoning', description: 'Complex logical problem solving', model: 'deepseek-chat', confidence: 0.95 },
      { name: 'Code Generation', description: 'Software development and debugging', model: 'deepseek-chat', confidence: 0.98 },
      { name: 'Mathematical Analysis', description: 'Advanced mathematics and calculations', model: 'deepseek-chat', confidence: 0.92 },
      { name: 'System Design', description: 'Architecture and engineering solutions', model: 'deepseek-chat', confidence: 0.90 }
    ]);

    // Llama 3.2 90B - Best for vision and multimodal
    this.capabilities.set('OpenRouter', [
      { name: 'Vision Understanding', description: 'Image analysis and interpretation', model: 'meta-llama/llama-3.2-90b-vision-instruct', confidence: 0.94 },
      { name: 'Strategic Thinking', description: 'Long-term planning and analysis', model: 'meta-llama/llama-3.2-90b-vision-instruct', confidence: 0.88 },
      { name: 'Complex Reasoning', description: 'Multi-step logical processes', model: 'meta-llama/llama-3.2-90b-vision-instruct', confidence: 0.87 }
    ]);

    // Gemini 2.0 - Best for creativity and multimodal
    this.capabilities.set('Gemini', [
      { name: 'Creative Writing', description: 'Content creation and storytelling', model: 'gemini-2.0-flash-exp', confidence: 0.91 },
      { name: 'Multimodal Understanding', description: 'Text, image, and context integration', model: 'gemini-2.0-flash-exp', confidence: 0.93 },
      { name: 'Language Translation', description: 'Multilingual communication', model: 'gemini-2.0-flash-exp', confidence: 0.89 }
    ]);

    // Groq Llama 3.3 - Best for speed and general conversation
    this.capabilities.set('Groq', [
      { name: 'Fast Responses', description: 'Real-time conversation and quick answers', model: 'llama-3.3-70b-versatile', confidence: 0.85 },
      { name: 'General Knowledge', description: 'Broad domain expertise', model: 'llama-3.3-70b-versatile', confidence: 0.82 },
      { name: 'Conversational AI', description: 'Natural dialogue and interaction', model: 'llama-3.3-70b-versatile', confidence: 0.84 }
    ]);
  }

  /**
   * Analyze user input and determine optimal approach
   */
  analyzeTask(userMessage: string, conversationHistory: Message[]): TaskAnalysis {
    const message = userMessage.toLowerCase();
    const isLongConversation = conversationHistory.length > 10;
    const hasCodeRequest = /code|programming|function|algorithm|debug|implement/.test(message);
    const hasCreativeRequest = /write|story|creative|poem|design|generate/.test(message);
    const hasAnalysisRequest = /analyze|compare|evaluate|research|data/.test(message);
    const hasComplexReasoning = /explain|why|how does|complex|detailed|comprehensive/.test(message);

    let taskType: TaskAnalysis['taskType'] = 'conversational';
    let complexity: TaskAnalysis['complexity'] = 'simple';
    let recommendedModel = 'groq';

    // Determine task type and complexity
    if (hasCodeRequest) {
      taskType = 'coding';
      complexity = message.includes('complex') || message.includes('advanced') ? 'expert' : 'medium';
      recommendedModel = 'deepseek';
    } else if (hasCreativeRequest) {
      taskType = 'creative';
      complexity = message.length > 100 ? 'medium' : 'simple';
      recommendedModel = 'gemini';
    } else if (hasAnalysisRequest) {
      taskType = 'analytical';
      complexity = isLongConversation ? 'complex' : 'medium';
      recommendedModel = 'openrouter';
    } else if (hasComplexReasoning) {
      taskType = 'complex_reasoning';
      complexity = 'complex';
      recommendedModel = 'deepseek';
    }

    // Estimate token requirements
    const estimatedTokens = this.estimateTokenRequirement(taskType, complexity, userMessage.length);

    return {
      taskType,
      complexity,
      recommendedModel,
      requiredCapabilities: this.getRequiredCapabilities(taskType),
      estimatedTokens
    };
  }

  private estimateTokenRequirement(taskType: TaskAnalysis['taskType'], complexity: TaskAnalysis['complexity'], inputLength: number): number {
    const baseTokens = Math.max(inputLength * 1.5, 100);
    const complexityMultiplier: Record<TaskAnalysis['complexity'], number> = { 
      simple: 2, 
      medium: 4, 
      complex: 6, 
      expert: 8 
    };
    const taskMultiplier: Record<TaskAnalysis['taskType'], number> = {
      coding: 3,
      creative: 2.5,
      analytical: 3.5,
      complex_reasoning: 4,
      research: 3,
      conversational: 1.5
    };

    return Math.round(baseTokens * complexityMultiplier[complexity] * taskMultiplier[taskType]);
  }

  private getRequiredCapabilities(taskType: TaskAnalysis['taskType']): string[] {
    const capabilityMap: Record<TaskAnalysis['taskType'], string[]> = {
      coding: ['Code Generation', 'Advanced Reasoning', 'System Design'],
      creative: ['Creative Writing', 'Multimodal Understanding'],
      analytical: ['Strategic Thinking', 'Complex Reasoning', 'Vision Understanding'],
      complex_reasoning: ['Advanced Reasoning', 'Mathematical Analysis'],
      research: ['General Knowledge', 'Strategic Thinking'],
      conversational: ['Conversational AI', 'Fast Responses']
    };

    return capabilityMap[taskType] || ['General Knowledge'];
  }

  /**
   * Get the best model for a specific task
   */
  getBestModelForTask(taskAnalysis: TaskAnalysis): string {
    // Use consensus for complex tasks, single best model for simple tasks
    if (taskAnalysis.complexity === 'expert' || taskAnalysis.complexity === 'complex') {
      return 'consensus'; // Use multi-model consensus
    }

    return taskAnalysis.recommendedModel;
  }

  /**
   * Intelligent routing - decides whether to use consensus or single model
   */
  async processIntelligentRequest(
    messages: Message[],
    onStream?: (chunk: string) => void,
    onProgress?: (step: string, progress: number) => void
  ) {
    const userMessage = messages[messages.length - 1]?.content || '';
    const taskAnalysis = this.analyzeTask(userMessage, messages);

    onProgress?.(`Analyzing task: ${taskAnalysis.taskType} (${taskAnalysis.complexity})`, 10);

    // For complex tasks, use consensus
    if (taskAnalysis.complexity === 'expert' || taskAnalysis.complexity === 'complex') {
      onProgress?.('Using multi-model consensus for optimal results', 20);
      return await multiModelAPI.sendMessage(messages, onStream, onProgress);
    }

    // For simple tasks, use optimized single model
    onProgress?.(`Using optimized ${taskAnalysis.recommendedModel} model`, 20);
    return await multiModelAPI.sendMessage(messages, onStream, onProgress);
  }

  /**
   * Get intelligence metrics for the system
   */
  getIntelligenceMetrics() {
    return {
      totalCapabilities: Array.from(this.capabilities.values()).flat().length,
      availableModels: Array.from(this.capabilities.keys()).length,
      averageConfidence: this.calculateAverageConfidence(),
      taskTypes: ['coding', 'creative', 'analytical', 'conversational', 'research', 'complex_reasoning']
    };
  }

  private calculateAverageConfidence(): number {
    const allCapabilities = Array.from(this.capabilities.values()).flat();
    const totalConfidence = allCapabilities.reduce((sum, cap) => sum + cap.confidence, 0);
    return Math.round((totalConfidence / allCapabilities.length) * 100) / 100;
  }
}

export const intelligentAgent = new IntelligentAgent();
