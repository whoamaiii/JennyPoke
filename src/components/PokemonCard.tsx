import { CardData } from '@/types/pokemon';
import { cn } from '@/lib/utils';
import cardBackImage from '@/assets/pokemon-card-back.png';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

interface PokemonCardProps {
  card: CardData;
  className?: string;
  style?: React.CSSProperties;
  showBack?: boolean;
  // The 'size' prop is no longer needed.
  // size?: 'small' | 'large'; 
  onClick?: () => void;
}

const rarityColors: Record<string, string> = {
  common: 'from-blue-400 to-blue-600',
  uncommon: 'from-blue-500 to-blue-700',
  rare: 'from-blue-600 to-blue-800',
  'ultra-rare': 'from-blue-700 via-blue-800 to-blue-900',
};

// 1. Remove 'size' from the function signature.
export const PokemonCard = ({ card, className, style, showBack = false, onClick }: PokemonCardProps) => {
  const { card: tcgCard, rarity } = card;

  const elRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (showBack) return;
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
  }, [showBack]);

  if (showBack) {
    return (
      // 2. Hardcode the 'large' size classes here.
      <div className={cn('relative rounded-2xl overflow-hidden shadow-2xl w-64 h-80 sm:w-80 sm:h-[28rem]', className)} style={style}>
        <img src={cardBackImage} alt="Pokémon Card Back" className="w-full h-full object-cover" />
      </div>
    );
  }

  const imgSmall = tcgCard.images.small;
  const imgLarge = tcgCard.images.large || imgSmall;
  // 3. Simplify image source logic to always use the large image.
  const imgSrc = imgLarge;

  return (
    <div
      ref={elRef}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative rounded-2xl overflow-hidden shadow-2xl bg-card transform will-change-transform',
        'transition-transform',
        // 2. Hardcode the 'large' size classes here as well.
        'w-64 h-80 sm:w-80 sm:h-[28rem]',
        className
      )}
      style={{ perspective: '1000px', ...(style || {}) }}
    >
      <div className="w-full h-full rounded-xl bg-card overflow-hidden relative">
        {imgSmall && imgLarge && imgSmall !== imgLarge && (
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
