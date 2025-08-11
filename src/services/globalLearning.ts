interface GlobalFeedback {
  messageId: string;
  userContext: string;
  aiResponse: string;
  reaction: 'like' | 'dislike' | 'love';
  timestamp: Date;
  sessionId: string;
  userAgent: string;
  responseMetrics: {
    length: number;
    hasCode: boolean;
    hasMarkdown: boolean;
    responseTime?: number;
  };
}

interface LearningPattern {
  pattern: string;
  successRate: number;
  totalCount: number;
  examples: string[];
}

export class GlobalLearningSystem {
  private static readonly GITHUB_REPO = 'vaibhav-nagre/nagregpt';
  private static readonly FIREBASE_CONFIG = {
   
    databaseURL: 'https://nagregpt-learning-default-rtdb.firebaseio.com/',
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  };

  private static sessionId = GlobalLearningSystem.generateSessionId();

 
  private static generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

 
  static async submitGlobalFeedback(
    messageId: string,
    userContext: string,
    aiResponse: string,
    reaction: 'like' | 'dislike' | 'love',
    responseTime?: number
  ): Promise<void> {
    const feedback: GlobalFeedback = {
      messageId,
      userContext: userContext.substring(0, 300),
      aiResponse: aiResponse.substring(0, 800),
      reaction,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent.substring(0, 100),
      responseMetrics: {
        length: aiResponse.length,
        hasCode: aiResponse.includes('```'),
        hasMarkdown: aiResponse.includes('#') || aiResponse.includes('*'),
        responseTime,
      },
    };

    try {
     
      await this.sendToFirebase(feedback);
      
     
      await this.sendToGitHubIssues(feedback);
      
     
      await this.sendToWebhook(feedback);
      
      console.log('🌍 Global feedback submitted successfully');
    } catch (error) {
      console.error('Failed to submit global feedback:', error);
     
      this.storeLocallyForLaterSync(feedback);
    }
  }

 
  private static async sendToFirebase(feedback: GlobalFeedback): Promise<void> {
    if (!this.FIREBASE_CONFIG.apiKey) {
      throw new Error('Firebase API key not configured');
    }

    const endpoint = `${this.FIREBASE_CONFIG.databaseURL}/feedback.json?auth=${this.FIREBASE_CONFIG.apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error(`Firebase submission failed: ${response.statusText}`);
    }
  }

  // Send feedback as GitHub Issue (Creative approach for static sites)
  private static async sendToGitHubIssues(feedback: GlobalFeedback): Promise<void> {
    const title = `Learning Data: ${feedback.reaction.toUpperCase()} - ${new Date().toISOString().split('T')[0]}`;
    const body = `
## User Feedback Data

**Reaction:** ${feedback.reaction} ${feedback.reaction === 'love' ? '❤️' : feedback.reaction === 'like' ? '👍' : '👎'}
**Timestamp:** ${feedback.timestamp.toISOString()}
**Session:** ${feedback.sessionId}

### User Context
\`\`\`
${feedback.userContext}
\`\`\`

### AI Response
\`\`\`
${feedback.aiResponse}
\`\`\`

### Response Metrics
- Length: ${feedback.responseMetrics.length} characters
- Has Code: ${feedback.responseMetrics.hasCode}
- Has Markdown: ${feedback.responseMetrics.hasMarkdown}
- Response Time: ${feedback.responseMetrics.responseTime || 'N/A'}ms

### Auto-Learning Suggestions
${this.generateLearningSuggestions(feedback)}

---
*This is automated learning data. Please analyze and update the AI prompts accordingly.*
    `;

    // Note: This requires a GitHub token with issues permission
    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (!githubToken) {
      console.warn('GitHub token not available for issue creation');
      return;
    }

    const response = await fetch(`https://api.github.com/repos/${this.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: ['learning-data', `reaction-${feedback.reaction}`],
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub Issues submission failed: ${response.statusText}`);
    }
  }

  // Send to a webhook service (like Zapier, IFTTT, or custom endpoint)
  private static async sendToWebhook(feedback: GlobalFeedback): Promise<void> {
    const webhookUrl = import.meta.env.VITE_LEARNING_WEBHOOK_URL;
    if (!webhookUrl) return;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nagregpt-feedback',
        data: feedback,
        source: 'nagregpt-app',
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook submission failed: ${response.statusText}`);
    }
  }

  // Generate learning suggestions based on feedback
  private static generateLearningSuggestions(feedback: GlobalFeedback): string {
    let suggestions = '';

    if (feedback.reaction === 'love') {
      suggestions += '✅ REPLICATE: This response style is excellent. Analyze and replicate:\n';
      suggestions += `- Response pattern for context: "${feedback.userContext}"\n`;
      suggestions += `- Length: ${feedback.responseMetrics.length} chars (optimal)\n`;
      if (feedback.responseMetrics.hasCode) suggestions += '- Code examples were appreciated\n';
      if (feedback.responseMetrics.hasMarkdown) suggestions += '- Markdown formatting was effective\n';
    } else if (feedback.reaction === 'like') {
      suggestions += '👍 GOOD: This response was well-received. Consider:\n';
      suggestions += `- Similar tone for context: "${feedback.userContext}"\n`;
      suggestions += `- Response length was appropriate (${feedback.responseMetrics.length} chars)\n`;
    } else if (feedback.reaction === 'dislike') {
      suggestions += '❌ AVOID: This response style needs improvement:\n';
      suggestions += `- Different approach needed for: "${feedback.userContext}"\n`;
      suggestions += `- Consider shorter/longer responses (was ${feedback.responseMetrics.length} chars)\n`;
      if (!feedback.responseMetrics.hasCode && feedback.userContext.toLowerCase().includes('code')) {
        suggestions += '- Missing code examples when requested\n';
      }
      if (feedback.responseMetrics.length > 1000) {
        suggestions += '- Response may have been too verbose\n';
      }
    }

    return suggestions;
  }

  // Store locally for later sync when online
  private static storeLocallyForLaterSync(feedback: GlobalFeedback): void {
    const pendingKey = 'nagregpt-pending-sync';
    try {
      const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      pending.push(feedback);
      localStorage.setItem(pendingKey, JSON.stringify(pending.slice(-20))); // Keep last 20
      console.log('📱 Stored feedback locally for later sync');
    } catch (error) {
      console.error('Failed to store pending feedback:', error);
    }
  }

  // Sync pending local feedback when back online
  static async syncPendingFeedback(): Promise<void> {
    const pendingKey = 'nagregpt-pending-sync';
    try {
      const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      if (pending.length === 0) return;

      console.log(`🔄 Syncing ${pending.length} pending feedback items...`);

      for (const feedback of pending) {
        try {
          await this.sendToFirebase(feedback);
          await this.sendToWebhook(feedback);
        } catch (error) {
          console.warn('Failed to sync individual feedback item:', error);
        }
      }

      // Clear synced items
      localStorage.removeItem(pendingKey);
      console.log('✅ Pending feedback synced successfully');
    } catch (error) {
      console.error('Failed to sync pending feedback:', error);
    }
  }

  // Fetch global learning patterns
  static async fetchGlobalLearningPatterns(): Promise<LearningPattern[]> {
    try {
      if (!this.FIREBASE_CONFIG.apiKey) {
        return this.getLocalLearningPatterns();
      }

      const endpoint = `${this.FIREBASE_CONFIG.databaseURL}/learning-patterns.json?auth=${this.FIREBASE_CONFIG.apiKey}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning patterns');
      }

      const data = await response.json();
      return data ? Object.values(data) : [];
    } catch (error) {
      console.error('Failed to fetch global learning patterns:', error);
      return this.getLocalLearningPatterns();
    }
  }

  // Generate local learning patterns as fallback
  private static getLocalLearningPatterns(): LearningPattern[] {
    const feedback = JSON.parse(localStorage.getItem('nagregpt-feedback') || '[]');
    const patterns: { [key: string]: LearningPattern } = {};

    feedback.forEach((item: any) => {
      const key = item.context.substring(0, 50);
      if (!patterns[key]) {
        patterns[key] = {
          pattern: key,
          successRate: 0,
          totalCount: 0,
          examples: [],
        };
      }

      patterns[key].totalCount++;
      if (item.reaction === 'like' || item.reaction === 'love') {
        patterns[key].successRate++;
      }
      if (patterns[key].examples.length < 3) {
        patterns[key].examples.push(item.messageContent.substring(0, 100));
      }
    });

    // Calculate success rates
    Object.values(patterns).forEach(pattern => {
      pattern.successRate = pattern.successRate / pattern.totalCount;
    });

    return Object.values(patterns).sort((a, b) => b.successRate - a.successRate);
  }

  // Generate improved prompt based on learning data
  static async generateImprovedPrompt(userMessage: string): Promise<string> {
    const patterns = await this.fetchGlobalLearningPatterns();
    const localStats = JSON.parse(localStorage.getItem('nagregpt-feedback') || '[]');

    let improvedPrompt = userMessage;

    // Add learning context
    if (patterns.length > 0) {
      improvedPrompt += '\n\n--- LEARNING CONTEXT ---\n';
      improvedPrompt += 'Based on global user feedback, prioritize response styles that have been well-received:\n';

      const topPatterns = patterns.filter(p => p.successRate > 0.7).slice(0, 3);
      topPatterns.forEach((pattern, index) => {
        improvedPrompt += `${index + 1}. For queries like "${pattern.pattern}": Use similar approach to "${pattern.examples[0]}"\n`;
      });

      const poorPatterns = patterns.filter(p => p.successRate < 0.3).slice(0, 2);
      if (poorPatterns.length > 0) {
        improvedPrompt += '\nAvoid response styles that received negative feedback:\n';
        poorPatterns.forEach((pattern) => {
          improvedPrompt += `- Avoid patterns like "${pattern.pattern}" (${Math.round(pattern.successRate * 100)}% success rate)\n`;
        });
      }
    }

    // Add local learning
    if (localStats.length > 0) {
      const recentLikes = localStats.filter((item: any) => 
        item.reaction === 'like' || item.reaction === 'love'
      ).slice(0, 2);

      if (recentLikes.length > 0) {
        improvedPrompt += '\nPersonal preference: User recently appreciated responses similar to:\n';
        recentLikes.forEach((item: any, index: number) => {
          improvedPrompt += `${index + 1}. "${item.messageContent.substring(0, 100)}..."\n`;
        });
      }
    }

    improvedPrompt += '\n--- END LEARNING CONTEXT ---\n\n';
    improvedPrompt += 'Please respond naturally while incorporating the successful patterns above.';

    return improvedPrompt;
  }

  // Auto-update system prompts based on feedback
  static async generateSystemPromptUpdate(): Promise<string> {
    const patterns = await this.fetchGlobalLearningPatterns();
    
    let systemUpdate = '';
    
    if (patterns.length > 0) {
      const successfulPatterns = patterns.filter(p => p.successRate > 0.8);
      const failedPatterns = patterns.filter(p => p.successRate < 0.2);

      systemUpdate += 'AUTOMATED LEARNING UPDATE:\n\n';
      
      if (successfulPatterns.length > 0) {
        systemUpdate += 'HIGH SUCCESS PATTERNS (replicate these):\n';
        successfulPatterns.slice(0, 5).forEach(pattern => {
          systemUpdate += `- "${pattern.pattern}" (${Math.round(pattern.successRate * 100)}% success)\n`;
        });
      }

      if (failedPatterns.length > 0) {
        systemUpdate += '\nLOW SUCCESS PATTERNS (avoid these):\n';
        failedPatterns.slice(0, 3).forEach(pattern => {
          systemUpdate += `- "${pattern.pattern}" (${Math.round(pattern.successRate * 100)}% success)\n`;
        });
      }

      systemUpdate += '\nAdjust response strategies accordingly for better user satisfaction.';
    }

    return systemUpdate;
  }
}

// Auto-sync pending feedback when the app comes online
window.addEventListener('online', () => {
  GlobalLearningSystem.syncPendingFeedback();
});

// Export for use in other components
export default GlobalLearningSystem;
