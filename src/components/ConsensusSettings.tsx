import { useState, useEffect } from 'react';
import { multiModelAPI } from '../services/multiModelAPI';
import { 
  CogIcon, 
  XMarkIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface ConsensusSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsensusSettings({ isOpen, onClose }: ConsensusSettingsProps) {
  const [consensusEnabled, setConsensusEnabled] = useState(true);
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const currentStatus = multiModelAPI.getStatus();
      setStatus(currentStatus);
      setConsensusEnabled(currentStatus.consensusEnabled);
      setFallbackEnabled(currentStatus.fallbackEnabled);
    }
  }, [isOpen]);

  const handleConsensusToggle = (enabled: boolean) => {
    setConsensusEnabled(enabled);
    multiModelAPI.setConsensusMode(enabled);
    
    // Refresh status
    const newStatus = multiModelAPI.getStatus();
    setStatus(newStatus);
  };

  const handleFallbackToggle = (enabled: boolean) => {
    setFallbackEnabled(enabled);
    multiModelAPI.setFallbackMode(enabled);
    
    // Refresh status
    const newStatus = multiModelAPI.getStatus();
    setStatus(newStatus);
  };

  const handleClearCache = () => {
    multiModelAPI.clearConsensusCache();
    
    // Refresh status
    const newStatus = multiModelAPI.getStatus();
    setStatus(newStatus);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 999999 }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        style={{ zIndex: 1000000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <CogIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🧠 Consensus AI Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure multi-model consensus behavior
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              System Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Available Providers:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {status?.availableProviders?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cache Entries:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {status?.cacheStats?.size || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Consensus Available:</span>
                <div className="flex items-center">
                  {status?.consensusAvailable ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-1" />
                  )}
                  <span className={`font-medium ${status?.consensusAvailable ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {status?.consensusAvailable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Session ID:</span>
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {status?.cacheStats?.sessionId?.substring(0, 12)}...
                </span>
              </div>
            </div>
          </div>

          {/* Provider List */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Active Providers</h3>
            <div className="space-y-2">
              {status?.availableProviders?.map((provider: string, index: number) => (
                <div key={provider} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${{
                      'DeepSeek': 'bg-blue-500',
                      'OpenRouter': 'bg-green-500',
                      'Gemini': 'bg-red-500',
                      'Groq': 'bg-purple-500'
                    }[provider] || 'bg-gray-500'}`} />
                    <span className="font-medium text-gray-900 dark:text-white">{provider}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Priority {index + 1}
                  </span>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No providers available
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Configuration</h3>
            
            {/* Consensus Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Consensus Mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use multiple models for higher accuracy and confidence checking
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={consensusEnabled}
                  onChange={(e) => handleConsensusToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Fallback Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Fallback Mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fall back to single model if consensus fails
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={fallbackEnabled}
                  onChange={(e) => handleFallbackToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Cache Management */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Cache Management</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Clear Cache</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Remove all cached consensus results (10 min auto-expiry)
                </p>
              </div>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              🔬 How Consensus AI Works
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>1.</strong> Generates responses from multiple LLMs at different temperatures (0.2, 0.25, 0.3)</p>
              <p><strong>2.</strong> Analyzes agreement between candidates (≥70% = HIGH confidence)</p>
              <p><strong>3.</strong> HIGH confidence: Synthesizes consistent answers + verification</p>
              <p><strong>4.</strong> LOW confidence: Shows uncertainty with candidate summaries</p>
              <p><strong>5.</strong> Caches results to avoid duplicate work with session-based seeding</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Consensus AI provides higher accuracy through multi-model validation
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
