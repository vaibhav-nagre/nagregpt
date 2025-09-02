import { useState, useEffect } from 'react';

interface ConsensusIndicatorProps {
  step: string;
  progress: number;
  isVisible: boolean;
}

export default function ConsensusIndicator({ step, progress, isVisible }: ConsensusIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isAnimating && !isVisible) return null;

  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center space-x-3">
          {/* Animated Consensus Icon */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 bg-white rounded-full animate-pulse`}
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Pulse Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 animate-ping" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                🧠 Consensus AI
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(progress)}%
              </span>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 truncate">
              {step}
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Process Steps Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className={`flex items-center space-x-1 ${progress >= 20 ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${progress >= 20 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span>Generate</span>
          </div>
          <div className={`flex items-center space-x-1 ${progress >= 50 ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${progress >= 50 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span>Analyze</span>
          </div>
          <div className={`flex items-center space-x-1 ${progress >= 80 ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${progress >= 80 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span>Synthesize</span>
          </div>
          <div className={`flex items-center space-x-1 ${progress >= 100 ? 'text-green-600 dark:text-green-400' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${progress >= 100 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span>Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
