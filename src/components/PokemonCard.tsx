import { CardData } from '@/types/pokemon';
import { cn } from '@/lib/utils';
import cardBackImage from '@/assets/pokemon-card-back.png';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

// Define the three required sizes: 'grid', 'small', and 'large'
type CardSize = 'grid' | 'small' | 'large';

interface PokemonCardProps {
  card: CardData;
  className?: string;
  style?: React.CSSProperties;
  showBack?: boolean;
  size?: CardSize;
  onClick?: () => void;
}

const rarityColors: Record<string, string> = {
  common: 'from-blue-400 to-blue-600',
  uncommon: 'from-blue-500 to-blue-700',
  rare: 'from-blue-600 to-blue-800',
  'ultra-rare': 'from-blue-700 via-blue-800 to-blue-900',
};

// 1. Helper function to get the correct size classes
const getSizeClasses = (size: CardSize) => {
  switch (size) {
    case 'grid':
      // Matches the Dashboard's max-w-[245px] and uses an aspect ratio
      return 'w-[245px] h-[335px]'; // Approximate height for card aspect ratio (245 * 1.367)
    case 'small':
      return 'w-32 h-40 sm:w-48 sm:h-56';
    case 'large':
    default:
      return 'w-64 h-80 sm:w-80 sm:h-[28rem]';
  }
};

export const PokemonCard = ({ card, className, style, showBack = false, size = 'grid', onClick }: PokemonCardProps) => {
  const { card: tcgCard, rarity } = card;
  const elRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  
  // Determine if the interactive effect should be enabled
  const isInteractive = size !== 'grid' && !showBack;

  useEffect(() => {
    if (!isInteractive) return;
    const el = elRef.current;
    if (!el) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const ry = px * 10;
      const rx = -py * 8;
      gsap.to(el, { rotationY: ry, rotationX: rx, scale: 1.02, duration: 0.25, ease: 'power3.out' });
    };

    const handlePointerLeave = () => {
      gsap.to(el, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1,0.6)' });
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);
    el.addEventListener('pointercancel', handlePointerLeave);

    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
      el.removeEventListener('pointercancel', handlePointerLeave);
    };
  }, [isInteractive]);

  const cardSizeClasses = getSizeClasses(size);

  if (showBack) {
    return (
      <div className={cn('relative rounded-2xl overflow-hidden shadow-2xl', cardSizeClasses, className)} style={style}>
        <img src={cardBackImage} alt="Pokémon Card Back" className="w-full h-full object-cover" />
      </div>
    );
  }

  const imgSmall = tcgCard.images.small;
  const imgLarge = tcgCard.images.large || imgSmall;
  // Use the small image for 'small' or 'grid' sizes to save bandwidth
  const imgSrc = (size === 'small' || size === 'grid') ? imgSmall || imgLarge : imgLarge;

  return (
    <div
      ref={elRef}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative rounded-2xl overflow-hidden shadow-2xl bg-card transform will-change-transform',
        'transition-transform',
        cardSizeClasses, // Apply the dynamically calculated size classes
        className
      )}
      style={{ perspective: '1000px', ...(style || {}) }}
    >
      <div className="w-full h-full rounded-xl bg-card overflow-hidden relative">
        {/* low-res placeholder underneath (blurred) - only useful if large is used */}
        {imgSmall && imgLarge && imgSmall !== imgLarge && size === 'large' && (
          <img
            src={imgSmall}
            aria-hidden
            className={cn('absolute inset-0 w-full h-full object-cover transition-opacity duration-500', loaded ? 'opacity-0' : 'opacity-100')}
          />
        )}

        <img
          src={imgSrc}
          alt={tcgCard.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn('relative w-full h-full object-cover transition-filter duration-500', loaded ? 'filter-none' : 'blur-sm')}
        />
      </div>
    </div>
  );
};

export default PokemonCard;
