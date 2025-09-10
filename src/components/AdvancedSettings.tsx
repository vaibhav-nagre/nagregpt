import React, { useState, useEffect } from 'react';
import { webIntegration } from '../services/webIntegration';
import { memorySystem } from '../services/memorySystem';
import { realTimeLearning } from '../services/realTimeLearning';

interface AdvancedSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SystemSettings {
  consensus: boolean;
  intelligentRouting: boolean;
  memory: boolean;
  learning: boolean;
  reasoning: boolean;
  webIntegration: boolean;
  voice: boolean;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    consensus: true,
    intelligentRouting: true,
    memory: true,
    learning: true,
    reasoning: true,
    webIntegration: true,
    voice: true
  });

  const [webConfig, setWebConfig] = useState<any>({});
  const [memoryStats, setMemoryStats] = useState(memorySystem.getMemoryStats());
  const [learningStats, setLearningStats] = useState(realTimeLearning.getLearningAnalytics('default_user'));
  const [cacheStats, setCacheStats] = useState<any>({});

  useEffect(() => {
    const loadConfigs = async () => {
      if (isOpen) {
        // Refresh stats when settings open
        setMemoryStats(memorySystem.getMemoryStats());
        setLearningStats(realTimeLearning.getLearningAnalytics('default_user'));
        setCacheStats(await webIntegration.getCacheStats());
        setWebConfig(await webIntegration.getConfig());
      }
    };
    loadConfigs();
  }, [isOpen]);

  const handleSettingChange = (setting: keyof SystemSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Save to localStorage
    localStorage.setItem('nagreGPT_advanced_settings', JSON.stringify({
      ...settings,
      [setting]: value
    }));
  };

  const handleWebConfigChange = async (config: Partial<any>) => {
    const newConfig = { ...webConfig, ...config };
    setWebConfig(newConfig);
    await webIntegration.updateConfig(newConfig);
  };

  const clearMemory = () => {
    if (confirm('Are you sure you want to clear all memory data? This cannot be undone.')) {
      // Clear memory data from localStorage
      localStorage.removeItem('nagreGPT_memory_data');
      setMemoryStats(memorySystem.getMemoryStats());
    }
  };

  const clearLearning = () => {
    if (confirm('Are you sure you want to reset all learning data? This cannot be undone.')) {
      // Clear learning data from localStorage
      localStorage.removeItem('nagreGPT_learning_data');
      setLearningStats(realTimeLearning.getLearningAnalytics('default_user'));
    }
  };

  const clearCache = () => {
    webIntegration.clearCache();
    setCacheStats(webIntegration.getCacheStats());
  };

  const exportData = () => {
    const data = {
      memory: memoryStats,
      learning: learningStats,
      settings: settings,
      webConfig: webConfig,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nagreGPT_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Advanced AI Settings
            </h2>
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

        <div className="p-6 space-y-8">
          {/* System Features */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Intelligence Systems
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getFeatureDescription(key as keyof SystemSettings)}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingChange(key as keyof SystemSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Web Integration Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Web Integration
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Real-time Search</span>
                  <input
                    type="checkbox"
                    checked={webConfig.enableRealTimeSearch}
                    onChange={(e) => handleWebConfigChange({ enableRealTimeSearch: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">News Integration</span>
                  <input
                    type="checkbox"
                    checked={webConfig.enableNewsIntegration}
                    onChange={(e) => handleWebConfigChange({ enableNewsIntegration: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Fact Checking</span>
                  <input
                    type="checkbox"
                    checked={webConfig.enableFactChecking}
                    onChange={(e) => handleWebConfigChange({ enableFactChecking: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Max Search Results:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={webConfig.maxSearchResults}
                  onChange={(e) => handleWebConfigChange({ maxSearchResults: parseInt(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Memory System</h4>
                <div className="space-y-1 text-sm">
                  <p>Total Memories: {memoryStats.totalMemories}</p>
                  <p>Average per User: {memoryStats.avgMemoriesPerUser}</p>
                  <p>Total Users: {memoryStats.totalUsers}</p>
                </div>
                <button
                  onClick={clearMemory}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear Memory
                </button>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Learning System</h4>
                <div className="space-y-1 text-sm">
                  <p>Interactions: {learningStats.totalInteractions}</p>
                  <p>Progress: {Math.round(learningStats.learningProgress * 100)}%</p>
                  <p>Quality Score: {Math.round(learningStats.learningTrends.responseQuality * 100)}%</p>
                </div>
                <button
                  onClick={clearLearning}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Reset Learning
                </button>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Web Cache</h4>
                <div className="space-y-1 text-sm">
                  <p>Search Cache: {cacheStats.searchCacheSize}</p>
                  <p>News Cache: {cacheStats.newsCacheSize}</p>
                  <p>Fact Checks: {cacheStats.factCheckCacheSize}</p>
                </div>
                <button
                  onClick={clearCache}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Data Management
            </h3>
            <div className="flex space-x-4">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export Data
              </button>
              <button
                onClick={() => {
                  clearMemory();
                  clearLearning();
                  clearCache();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset All Data
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

function getFeatureDescription(feature: keyof SystemSettings): string {
  const descriptions = {
    consensus: 'Multi-model consensus for complex queries',
    intelligentRouting: 'Smart model selection based on task type',
    memory: 'Long-term memory and context retention',
    learning: 'Real-time learning from user feedback',
    reasoning: 'Advanced multi-step reasoning for complex problems',
    webIntegration: 'Real-time web search and fact-checking',
    voice: 'Voice input and output capabilities'
  };
  return descriptions[feature] || 'Advanced AI feature';
}
