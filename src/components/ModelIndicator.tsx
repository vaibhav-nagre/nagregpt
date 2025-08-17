import { useState, useEffect } from 'react';
import { latest2025AI } from '../services/latest2025AI';
import type { ModelInfo } from '../services/latest2025AI';
import { CpuChipIcon } from '@heroicons/react/24/outline';

interface ModelIndicatorProps {
  variant?: 'header' | 'floating' | 'detailed';
  className?: string;
}

export default function ModelIndicator({ variant = 'floating', className = '' }: ModelIndicatorProps) {
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const modelInfo = latest2025AI.getBestModel();
    setCurrentModel(modelInfo);
  }, []);

  if (!currentModel) return null;

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'deepseek':
        return 'from-blue-500 to-cyan-500';
      case 'openrouter':
        return 'from-green-500 to-emerald-500';
      case 'google':
      case 'gemini':
        return 'from-red-500 to-orange-500';
      case 'groq':
        return 'from-purple-500 to-violet-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance.toLowerCase()) {
      case 'superior':
        return '🚀';
      case 'excellent':
        return '⭐';
      case 'high':
        return '💎';
      default:
        return '🤖';
    }
  };

  if (variant === 'header') {
    return (
      <div className={`hidden md:flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r ${getProviderColor(currentModel.provider)}/10 border border-current/20 ${className}`}>
        <div className={`w-2 h-2 bg-gradient-to-r ${getProviderColor(currentModel.provider)} rounded-full animate-pulse`}></div>
        <span className={`text-xs font-medium bg-gradient-to-r ${getProviderColor(currentModel.provider)} bg-clip-text text-transparent`}>
          {currentModel.name}
        </span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white/90 dark:bg-gpt-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gpt-gray-600/50 rounded-lg p-4 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${getProviderColor(currentModel.provider)} rounded-lg flex items-center justify-center`}>
            <CpuChipIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {currentModel.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentModel.provider} • {currentModel.performance}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Training Data:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{currentModel.trainingData}</span>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-400 block mb-1">Capabilities:</span>
            <div className="flex flex-wrap gap-1">
              {currentModel.capabilities.map((capability, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default floating variant
  return (
    <div 
      className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-10 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="bg-white/90 dark:bg-gpt-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gpt-gray-600/50 rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 bg-gradient-to-r ${getProviderColor(currentModel.provider)} rounded-full animate-pulse`}></div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            <span className="text-gray-500 dark:text-gray-400">AI:</span> {currentModel.name}
          </div>
          <span className="text-xs">{getPerformanceIcon(currentModel.performance)}</span>
        </div>
        
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-white dark:bg-gpt-gray-800 border border-gray-200 dark:border-gpt-gray-600 rounded-lg shadow-lg animate-slide-in-up">
            <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">
              {currentModel.name}
            </div>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div>Provider: {currentModel.provider}</div>
              <div>Performance: {currentModel.performance}</div>
              <div>Training: {currentModel.trainingData}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Top capabilities: {currentModel.capabilities.slice(0, 2).join(', ')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
