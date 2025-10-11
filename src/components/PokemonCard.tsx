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
  size?: 'small' | 'large';
  onClick?: () => void;
}

const rarityColors: Record<string, string> = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  'ultra-rare': 'from-purple-400 via-pink-500 to-yellow-500',
};

export const PokemonCard = ({ card, className, style, showBack = false, size = 'large', onClick }: PokemonCardProps) => {
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
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden shadow-2xl',
          size === 'small' ? 'w-48 h-56' : 'w-80 h-[28rem]',
          className
        )}
        style={style}
      >
        <img
          src={cardBackImage}
          alt="Pokémon Card Back"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const imgSmall = tcgCard.images.small;
  const imgLarge = tcgCard.images.large || imgSmall;
  const imgSrc = size === 'small' ? imgSmall || imgLarge : imgLarge;

  return (
    <div
      ref={elRef}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative rounded-2xl overflow-hidden shadow-2xl bg-card transform will-change-transform',
        'transition-transform',
        size === 'small' ? 'w-48 h-56' : 'w-80 h-[28rem]',
        className
      )}
      style={{ perspective: '1000px', ...(style || {}) }}
    >
      {/* Rarity border */}
      <div className={cn('absolute inset-0 p-1 rounded-2xl bg-gradient-to-br', rarityColors[rarity])}>
        <div className="w-full h-full rounded-xl bg-card overflow-hidden relative">
          {/* low-res placeholder underneath (blurred) */}
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
    </div>
  );
};

export default PokemonCard;
