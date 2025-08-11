import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  HeartIcon, 
  HandThumbUpIcon, 
  HandThumbDownIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import GlobalLearningSystem from '../services/globalLearning';
import { FeedbackManager } from '../utils/feedbackManager';

interface LearningInsightsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LearningPattern {
  pattern: string;
  successRate: number;
  totalCount: number;
  examples: string[];
}

export default function LearningInsights({ isOpen, onClose }: LearningInsightsProps) {
  const [localStats, setLocalStats] = useState<any>(null);
  const [globalPatterns, setGlobalPatterns] = useState<LearningPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'local' | 'global' | 'patterns'>('local');

  useEffect(() => {
    if (isOpen) {
      loadLearningData();
    }
  }, [isOpen]);

  const loadLearningData = async () => {
    setIsLoading(true);
    try {
      const stats = FeedbackManager.getFeedbackStats();
      const feedback = FeedbackManager.getFeedbackHistory();
      setLocalStats({ ...stats, feedback });

      const patterns = await GlobalLearningSystem.fetchGlobalLearningPatterns();
      setGlobalPatterns(patterns);
    } catch (error) {
      console.error('Failed to load learning data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessRate = () => {
    if (!localStats || localStats.total === 0) return 0;
    return Math.round(((localStats.likes + localStats.loves) / localStats.total) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Learning Insights
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'local'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Your Feedback
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'global'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <GlobeAltIcon className="w-4 h-4 inline mr-1" />
            Global Learning
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'patterns'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ChartBarIcon className="w-4 h-4 inline mr-1" />
            Success Patterns
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading insights...</span>
            </div>
          ) : (
            <>
              
              {activeTab === 'local' && localStats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                      <HeartIconSolid className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {localStats.loves}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Loved</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                      <HandThumbUpIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {localStats.likes}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Liked</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                      <HandThumbDownIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {localStats.dislikes}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Disliked</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                      <ChartBarIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {getSuccessRate()}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      🎯 How Your Feedback Helps
                    </h3>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• Your reactions train the AI to respond better to similar questions</li>
                      <li>• Feedback is analyzed globally to improve responses for all users</li>
                      <li>• Response patterns and timing are optimized based on preferences</li>
                      <li>• The AI learns your communication style and adapts accordingly</li>
                    </ul>
                  </div>

                  {localStats.feedback && localStats.feedback.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Recent Feedback History
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {localStats.feedback.slice(0, 10).map((item: any, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                {item.reaction === 'love' && <HeartIcon className="w-4 h-4 text-red-500" />}
                                {item.reaction === 'like' && <HandThumbUpIcon className="w-4 h-4 text-blue-500" />}
                                {item.reaction === 'dislike' && <HandThumbDownIcon className="w-4 h-4 text-red-500" />}
                                <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                                  {item.reaction}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              Context: {item.context}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                              Response: {item.messageContent}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              
              {activeTab === 'global' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      🌍 Global Learning Network
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Your feedback contributes to a global learning system that improves NagreGPT for everyone.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {globalPatterns.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Learning Patterns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          Real-time
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Updates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          Auto-improving
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Responses</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                      🔄 How Global Learning Works
                    </h4>
                    <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
                      <li>Your feedback is anonymously collected and analyzed</li>
                      <li>Successful response patterns are identified across all users</li>
                      <li>The AI model adapts its responses based on what works best</li>
                      <li>Updates are deployed automatically to improve future conversations</li>
                      <li>Privacy is maintained while enabling collective learning</li>
                    </ol>
                  </div>
                </div>
              )}

              
              {activeTab === 'patterns' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      📊 Successful Response Patterns
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      These patterns have the highest success rates based on user feedback
                    </p>
                  </div>

                  {globalPatterns.length > 0 ? (
                    <div className="space-y-4">
                      {globalPatterns.slice(0, 8).map((pattern, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Pattern #{index + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                pattern.successRate > 0.8 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : pattern.successRate > 0.6
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {Math.round(pattern.successRate * 100)}% success
                              </div>
                              <span className="text-xs text-gray-500">
                                {pattern.totalCount} samples
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {pattern.pattern}
                          </p>
                          {pattern.examples.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Example: "{pattern.examples[0]}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Learning patterns will appear as more feedback is collected
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Your feedback makes NagreGPT smarter for everyone 🧠✨
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
