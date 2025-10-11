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
  return (
    <div
      ref={elRef}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative rounded-2xl overflow-hidden shadow-2xl bg-card transform will-change-transform',
        'transition-transform',
        size === 'small' ? 'w-48' : 'w-80 h-[28rem]',
        className
      )}
      style={{ perspective: '1000px', ...(style || {}) }}
    >
      {/* Rarity border */}
      <div className={cn('absolute inset-0 p-1 rounded-2xl bg-gradient-to-br', rarityColors[rarity])}>
        <div className="w-full h-full rounded-xl bg-card overflow-hidden relative flex items-center justify-center">
          {/* low-res placeholder underneath (blurred) */}
          {imgSmall && imgLarge && imgSmall !== imgLarge && (
            <img
              src={imgSmall}
              aria-hidden
              className={cn('absolute inset-0 w-full h-full object-cover transition-opacity duration-500', loaded ? 'opacity-0' : 'opacity-100')}
            />
          )}

          {size === 'small' ? (
            <div className="w-full h-full p-2 flex items-center justify-center">
              <img
                src={imgLarge}
                alt={tcgCard.name}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                className={cn('max-w-full max-h-full object-contain transition-filter duration-500', loaded ? 'filter-none' : 'blur-sm')}
              />
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={tcgCard.name}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={cn('relative w-full h-full object-cover transition-filter duration-500', loaded ? 'filter-none' : 'blur-sm')}
            />
          )}
        </div>
      </div>
    </div>
  );
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
