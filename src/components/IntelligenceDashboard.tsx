import React, { useState, useEffect } from 'react';
import { multiModelAPI } from '../services/multiModelAPI';
import { webIntegration } from '../services/webIntegration';
import { memorySystem } from '../services/memorySystem';
import { realTimeLearning } from '../services/realTimeLearning';
import { intelligentAgent } from '../services/intelligentAgent';
import { AdvancedSettings } from './AdvancedSettings';

interface IntelligenceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({ isOpen, onClose, userId }) => {
  const [dashboardData, setDashboardData] = useState({
    consensus: { stats: null as any, isLoading: true },
    memory: { stats: null as any, isLoading: true },
    learning: { stats: null as any, isLoading: true },
    intelligence: { metrics: null as any, isLoading: true },
    web: { stats: null as any, trending: [] as string[], isLoading: true }
  });

  const [refreshing, setRefreshing] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen, userId]);

  const loadDashboardData = async () => {
    setRefreshing(true);
    
    try {
      // Load all system data
      const [
        consensusStats,
        memoryStats,
        learningStats,
        intelligenceMetrics,
        webStats,
        trendingTopics
      ] = await Promise.all([
        multiModelAPI.getConsensusStats(),
        memorySystem.getMemoryStats(),
        realTimeLearning.getLearningAnalytics(userId),
        intelligentAgent.getIntelligenceMetrics(),
        webIntegration.getCacheStats(),
        webIntegration.getTrendingTopics()
      ]);

      setDashboardData({
        consensus: { stats: consensusStats, isLoading: false },
        memory: { stats: memoryStats, isLoading: false },
        learning: { stats: learningStats, isLoading: false },
        intelligence: { metrics: intelligenceMetrics, isLoading: false },
        web: { stats: webStats, trending: trendingTopics, isLoading: false }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Intelligence Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time insights into NagreGPT's advanced AI systems
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAdvancedSettings(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
                title="Advanced AI Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span>AI Settings</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {refreshing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* System Overview */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Consensus Model</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {dashboardData.consensus.stats?.entries?.length || 0}
                    </p>
                  </div>
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Multi-model consensus active
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">Memory System</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                      {dashboardData.memory.stats?.totalMemories || 0}
                    </p>
                  </div>
                  <div className="bg-green-600 text-white p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {dashboardData.memory.stats?.totalUsers || 0} users tracked
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Learning System</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                      {dashboardData.learning.stats?.totalInteractions || 0}
                    </p>
                  </div>
                  <div className="bg-purple-600 text-white p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {Math.round((dashboardData.learning.stats?.learningProgress || 0) * 100)}% progress
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Web Integration</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">
                      {(dashboardData.web.stats?.searchCacheSize || 0) + (dashboardData.web.stats?.newsCacheSize || 0)}
                    </p>
                  </div>
                  <div className="bg-orange-600 text-white p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Real-time data active
                </p>
              </div>
            </div>
          </section>

          {/* Intelligent Agent Metrics */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Intelligent Agent Performance
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Task Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Simple:</span>
                      <span className="font-medium text-gray-900 dark:text-white">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Complex:</span>
                      <span className="font-medium text-gray-900 dark:text-white">35%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Expert:</span>
                      <span className="font-medium text-gray-900 dark:text-white">20%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Model Usage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">DeepSeek:</span>
                      <span className="font-medium text-gray-900 dark:text-white">30%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Gemini:</span>
                      <span className="font-medium text-gray-900 dark:text-white">25%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Groq:</span>
                      <span className="font-medium text-gray-900 dark:text-white">25%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">OpenRouter:</span>
                      <span className="font-medium text-gray-900 dark:text-white">20%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Avg Response Time:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dashboardData.intelligence.metrics?.averageResponseTime ? 
                          `${Math.round(dashboardData.intelligence.metrics.averageResponseTime)}ms` : 
                          'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dashboardData.intelligence.metrics?.successRate ? 
                          `${Math.round(dashboardData.intelligence.metrics.successRate * 100)}%` : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Learning Insights */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Learning Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Strong Areas</h4>
                <div className="space-y-2">
                  {dashboardData.learning.stats?.strongAreas?.map((area: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{area}</span>
                    </div>
                  )) || <p className="text-sm text-gray-500 dark:text-gray-400">Learning in progress...</p>}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Improvement Areas</h4>
                <div className="space-y-2">
                  {dashboardData.learning.stats?.improvementAreas?.map((area: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{area}</span>
                    </div>
                  )) || <p className="text-sm text-gray-500 dark:text-gray-400">No specific areas identified</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Trending Topics */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trending Topics
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {dashboardData.web.trending.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              {dashboardData.web.trending.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading trending topics...</p>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Advanced Settings Modal */}
      <AdvancedSettings 
        isOpen={showAdvancedSettings}
        onClose={() => setShowAdvancedSettings(false)}
      />
    </div>
  );
};
