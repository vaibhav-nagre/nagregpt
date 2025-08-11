import GlobalLearningSystem from '../services/globalLearning';

interface MessageFeedback {
  messageId: string;
  messageContent: string;
  reaction: 'like' | 'dislike' | 'love';
  timestamp: Date;
  context: string; // Previous user message for context
}

export class FeedbackManager {
  private static readonly STORAGE_KEY = 'nagregpt-feedback';
  private static readonly MAX_FEEDBACK_ITEMS = 50; // Keep last 50 feedback items

  // Store user reaction feedback
  static async storeFeedback(
    messageId: string,
    messageContent: string,
    reaction: 'like' | 'dislike' | 'love',
    userContext: string,
    responseTime?: number
  ): Promise<void> {
    const feedback: MessageFeedback = {
      messageId,
      messageContent: messageContent.substring(0, 500), // Limit content length
      reaction,
      timestamp: new Date(),
      context: userContext.substring(0, 200), // Limit context length
    };

    const existingFeedback = this.getFeedbackHistory();
    const updatedFeedback = [feedback, ...existingFeedback]
      .slice(0, this.MAX_FEEDBACK_ITEMS); // Keep only recent feedback

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFeedback));
      console.log(`📝 Stored ${reaction} feedback for message`, messageId);
      
      // 🌍 NEW: Submit to global learning system
      await GlobalLearningSystem.submitGlobalFeedback(
        messageId,
        userContext,
        messageContent,
        reaction,
        responseTime
      );
      
      // Dispatch custom event for real-time UI updates
      window.dispatchEvent(new CustomEvent('feedback-updated', {
        detail: { reaction, messageId, stats: this.getFeedbackStats() }
      }));
    } catch (error) {
      console.error('Failed to store feedback:', error);
    }
  }

  // Get feedback history
  static getFeedbackHistory(): MessageFeedback[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const feedback = JSON.parse(stored);
      return feedback.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load feedback history:', error);
      return [];
    }
  }

  // Generate learning context for AI based on feedback history
  static generateLearningContext(): string {
    const feedback = this.getFeedbackHistory();
    if (feedback.length === 0) return '';

    const likes = feedback.filter(f => f.reaction === 'like');
    const dislikes = feedback.filter(f => f.reaction === 'dislike');
    const loves = feedback.filter(f => f.reaction === 'love');

    let context = '\n\nUser Feedback Learning Context:\n';
    
    if (loves.length > 0) {
      context += `\nExcellent responses (❤️ reactions) - User loved these:\n`;
      loves.slice(0, 3).forEach(item => {
        context += `- Context: "${item.context}" → Response style was excellent\n`;
      });
    }

    if (likes.length > 0) {
      context += `\nGood responses (👍 reactions) - User liked these:\n`;
      likes.slice(0, 3).forEach(item => {
        context += `- Context: "${item.context}" → Response style was good\n`;
      });
    }

    if (dislikes.length > 0) {
      context += `\nPoor responses (👎 reactions) - User disliked these, avoid similar styles:\n`;
      dislikes.slice(0, 3).forEach(item => {
        context += `- Context: "${item.context}" → Response style needs improvement\n`;
      });
    }

    context += '\nAdapt your response style based on this feedback pattern.';
    return context;
  }

  // Get feedback statistics
  static getFeedbackStats(): { likes: number; dislikes: number; loves: number; total: number } {
    const feedback = this.getFeedbackHistory();
    return {
      likes: feedback.filter(f => f.reaction === 'like').length,
      dislikes: feedback.filter(f => f.reaction === 'dislike').length,
      loves: feedback.filter(f => f.reaction === 'love').length,
      total: feedback.length,
    };
  }

  // Clear old feedback (optional maintenance)
  static clearOldFeedback(daysOld: number = 30): void {
    const feedback = this.getFeedbackHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const recentFeedback = feedback.filter(f => f.timestamp > cutoffDate);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentFeedback));
      console.log(`🧹 Cleaned up old feedback, kept ${recentFeedback.length} recent items`);
    } catch (error) {
      console.error('Failed to clean up feedback:', error);
    }
  }
}
