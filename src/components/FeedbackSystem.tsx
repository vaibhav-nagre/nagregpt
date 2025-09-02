import { useState } from 'react';
import { 
  HandThumbUpIcon,
  HandThumbDownIcon,
  StarIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon,
  HandThumbDownIcon as HandThumbDownSolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid';

interface FeedbackSystemProps {
  messageId: string;
  messageContent: string;
  conversationId: string;
  onFeedback?: (feedback: {
    messageId: string;
    reaction: 'helpful' | 'not_helpful' | 'partially_helpful' | 'perfect' | 'needs_improvement';
    rating?: number;
    comment?: string;
    improvementArea?: string;
  }) => void;
}

export default function FeedbackSystem({ 
  messageId, 
  messageContent: _messageContent, 
  conversationId: _conversationId, 
  onFeedback 
}: FeedbackSystemProps) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [improvementArea, setImprovementArea] = useState('');

  const handleQuickFeedback = (reaction: string) => {
    setUserReaction(reaction);
    
    // Send immediate feedback
    onFeedback?.({
      messageId,
      reaction: reaction as any,
      rating: reaction === 'helpful' ? 4 : reaction === 'perfect' ? 5 : 2
    });

    // Show detailed feedback for negative reactions
    if (reaction === 'not_helpful' || reaction === 'needs_improvement') {
      setShowDetailedFeedback(true);
    }
  };

  const handleDetailedFeedback = () => {
    onFeedback?.({
      messageId,
      reaction: userReaction as any,
      rating,
      comment: feedbackComment || undefined,
      improvementArea: improvementArea || undefined
    });
    
    setShowDetailedFeedback(false);
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    
    // Auto-determine reaction based on rating
    let reaction = 'partially_helpful';
    if (newRating >= 5) reaction = 'perfect';
    else if (newRating >= 4) reaction = 'helpful';
    else if (newRating >= 3) reaction = 'partially_helpful';
    else if (newRating >= 2) reaction = 'needs_improvement';
    else reaction = 'not_helpful';
    
    setUserReaction(reaction);
  };

  return (
    <div className="feedback-system mt-2 space-y-2">
      {/* Quick Feedback Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuickFeedback('helpful')}
          className={`p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            userReaction === 'helpful' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          }`}
          title="This was helpful"
        >
          {userReaction === 'helpful' ? (
            <HandThumbUpSolidIcon className="w-4 h-4" />
          ) : (
            <HandThumbUpIcon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => handleQuickFeedback('not_helpful')}
          className={`p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            userReaction === 'not_helpful' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          }`}
          title="This was not helpful"
        >
          {userReaction === 'not_helpful' ? (
            <HandThumbDownSolidIcon className="w-4 h-4" />
          ) : (
            <HandThumbDownIcon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => handleQuickFeedback('perfect')}
          className={`p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            userReaction === 'perfect' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Perfect response!"
        >
          {userReaction === 'perfect' ? (
            <StarSolidIcon className="w-4 h-4" />
          ) : (
            <StarIcon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          title="Provide detailed feedback"
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Star Rating */}
      {(showDetailedFeedback || userReaction) && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Rate this response:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingChange(star)}
              className="p-0.5 hover:scale-110 transition-transform duration-200"
            >
              {star <= rating ? (
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              ) : (
                <StarIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 hover:text-yellow-400" />
              )}
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
              {rating}/5
            </span>
          )}
        </div>
      )}

      {/* Detailed Feedback Form */}
      {showDetailedFeedback && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              What could be improved?
            </label>
            <select
              value={improvementArea}
              onChange={(e) => setImprovementArea(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select an area...</option>
              <option value="too_long">Response too long</option>
              <option value="too_short">Response too short</option>
              <option value="too_technical">Too technical</option>
              <option value="not_specific">Not specific enough</option>
              <option value="incorrect_info">Incorrect information</option>
              <option value="poor_formatting">Poor formatting</option>
              <option value="missed_context">Missed context</option>
              <option value="unhelpful_tone">Unhelpful tone</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional comments (optional)
            </label>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Tell us how we can improve..."
              className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              rows={2}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {feedbackComment.length}/200 characters
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowDetailedFeedback(false)}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDetailedFeedback}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}

      {/* Thank You Message */}
      {userReaction && !showDetailedFeedback && (
        <div className="text-xs text-green-600 dark:text-green-400 animate-fade-in">
          ✅ Thank you for your feedback! This helps me learn and improve.
        </div>
      )}
    </div>
  );
}
