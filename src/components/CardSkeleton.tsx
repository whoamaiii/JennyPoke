import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getCardDimensions } from "@/lib/cardUtils";

interface CardSkeletonProps {
  size?: 'small' | 'grid' | 'large';
  className?: string;
}

const getSizeClasses = (size: CardSkeletonProps['size']) => {
  return getCardDimensions(size || 'grid').className;
};

export const CardSkeleton = ({ size = 'grid', className }: CardSkeletonProps) => {
  const cardSizeClasses = getSizeClasses(size);

  return (
    <div className={cn('relative rounded-2xl overflow-hidden shadow-2xl', cardSizeClasses, className)}>
      <Skeleton className="w-full h-full" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};

export default CardSkeleton;
