import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressIndicator = ({ 
  progress, 
  label, 
  showPercentage = true, 
  size = 'md',
  className 
}: ProgressIndicatorProps) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className={cn('font-medium text-foreground', textSizeClasses[size])}>
            {label}
          </span>
          {showPercentage && (
            <span className={cn('text-muted-foreground', textSizeClasses[size])}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out rounded-full',
            'relative overflow-hidden'
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
