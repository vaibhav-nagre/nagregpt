import GlobalLearningSystem from '../services/globalLearning';

interface MessageFeedback {
  messageId: string;
  messageContent: string;
  reaction: 'like' | 'dislike' | 'love';
  timestamp: Date;
  context: string;
}

export class FeedbackManager {
  private static readonly STORAGE_KEY = 'nagregpt-feedback';
  private static readonly MAX_FEEDBACK_ITEMS = 50;

  static async storeFeedback(
    messageId: string,
    messageContent: string,
    reaction: 'like' | 'dislike' | 'love',
    userContext: string,
    responseTime?: number
  ): Promise<void> {
    const feedback: MessageFeedback = {
      messageId,
      messageContent: messageContent.substring(0, 500),
      reaction,
      timestamp: new Date(),
      context: userContext.substring(0, 200),
    };

    const existingFeedback = this.getFeedbackHistory();
    const updatedFeedback = [feedback, ...existingFeedback]
      .slice(0, this.MAX_FEEDBACK_ITEMS);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFeedback));
      
      await GlobalLearningSystem.submitGlobalFeedback(
        messageId,
        userContext,
        messageContent,
        reaction,
        responseTime
      );
      
      window.dispatchEvent(new CustomEvent('feedback-updated', {
        detail: { reaction, messageId, stats: this.getFeedbackStats() }
      }));
    } catch (error) {
      console.error('Failed to store feedback:', error);
    }
  }

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

  static getFeedbackStats(): { likes: number; dislikes: number; loves: number; total: number } {
    const feedback = this.getFeedbackHistory();
    return {
      likes: feedback.filter(f => f.reaction === 'like').length,
      dislikes: feedback.filter(f => f.reaction === 'dislike').length,
      loves: feedback.filter(f => f.reaction === 'love').length,
      total: feedback.length,
    };
  }

  static clearOldFeedback(daysOld: number = 30): void {
    const feedback = this.getFeedbackHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const recentFeedback = feedback.filter(f => f.timestamp > cutoffDate);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentFeedback));
    } catch (error) {
      console.error('Failed to clean up feedback:', error);
    }
  }
}
