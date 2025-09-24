import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text = "Loading..." 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-5'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", containerClasses[size], className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-medical",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;