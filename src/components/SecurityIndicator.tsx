import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SecurityIndicatorProps {
  isSecure: boolean;
  riskScore?: number;
  threatCount?: number;
  className?: string;
}

export default function SecurityIndicator({ 
  isSecure, 
  riskScore = 0, 
  threatCount = 0, 
  className = '' 
}: SecurityIndicatorProps) {
  const getSecurityLevel = () => {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  };

  const securityLevel = getSecurityLevel();

  const getIndicatorColor = () => {
    if (!isSecure) {
      switch (securityLevel) {
        case 'critical': return 'text-red-600 dark:text-red-400';
        case 'high': return 'text-orange-600 dark:text-orange-400';
        case 'medium': return 'text-yellow-600 dark:text-yellow-400';
        default: return 'text-green-600 dark:text-green-400';
      }
    }
    return 'text-green-600 dark:text-green-400';
  };

  const getBackgroundColor = () => {
    if (!isSecure) {
      switch (securityLevel) {
        case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        case 'high': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
        case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        default: return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      }
    }
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  const getStatusText = () => {
    if (!isSecure) {
      switch (securityLevel) {
        case 'critical': return `Critical Security Alert (${riskScore}% risk)`;
        case 'high': return `High Security Alert (${riskScore}% risk)`;
        case 'medium': return `Security Warning (${riskScore}% risk)`;
        default: return `Security Notice (${riskScore}% risk)`;
      }
    }
    return 'Secure Communication';
  };

  if (isSecure && riskScore === 0) {
    // Don't show indicator for completely safe interactions
    return null;
  }

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getBackgroundColor()} ${className}`}>
      {isSecure ? (
        <ShieldCheckIcon className={`w-3 h-3 ${getIndicatorColor()}`} />
      ) : (
        <ExclamationTriangleIcon className={`w-3 h-3 ${getIndicatorColor()}`} />
      )}
      <span className={getIndicatorColor()}>
        {getStatusText()}
      </span>
      {threatCount > 0 && (
        <span className={`ml-1 px-1 py-0.5 rounded text-xs ${getIndicatorColor()}`}>
          {threatCount} threat{threatCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
