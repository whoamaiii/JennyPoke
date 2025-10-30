import React from 'react';
import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { useHolographicEffect } from '@/hooks/useHolographicEffect';
import { isHolographicCard, mapRarityToDataAttr, getTypeClass } from '@/lib/holographicUtils';
import { cn } from '@/lib/utils';

type CardSize = 'grid' | 'small' | 'large';

interface HolographicPokemonCardProps {
  card: CardData;
  className?: string;
  style?: React.CSSProperties;
  showBack?: boolean;
  size?: CardSize;
  onClick?: () => void;
  enableHolographic?: boolean;
  holographicIntensity?: number;
}

export const HolographicPokemonCard: React.FC<HolographicPokemonCardProps> = ({
  card,
  className,
  style,
  showBack = false,
  size = 'grid',
  onClick,
  enableHolographic = true,
  holographicIntensity = 1
}) => {
  const { card: tcgCard, rarity } = card;

  // Determine if this card should have holographic effects
  const shouldApplyHolo = enableHolographic &&
                          size !== 'small' &&
                          !showBack &&
                          isHolographicCard(rarity, tcgCard);

  // Use holographic hook if applicable
  const { cardRef } = useHolographicEffect({
    enabled: shouldApplyHolo,
    intensity: holographicIntensity,
    rotationLimit: size === 'large' ? 18 : 15
  });

  // If not holographic, render regular PokemonCard
  if (!shouldApplyHolo) {
    return (
      <PokemonCard
        card={card}
        className={className}
        style={style}
        showBack={showBack}
        size={size}
        onClick={onClick}
      />
    );
  }

  // Render holographic version
  const rarityAttr = mapRarityToDataAttr(rarity, tcgCard);
  const typeClass = getTypeClass(tcgCard);

  return (
    <div
      ref={cardRef}
      className={cn('holo-card interactive', typeClass, className)}
      data-rarity={rarityAttr}
      style={style}
    >
      <div className="holo-card__translater">
        <div className="holo-card__rotator">
          <div className="holo-card__front">
            {/* Render the actual card using PokemonCard */}
            <PokemonCard
              card={card}
              showBack={showBack}
              size={size}
              onClick={onClick}
              className="relative"
              style={{ borderRadius: 'inherit' }}
            />

            {/* Holographic layers */}
            <div className="holo-card__shine" />
            <div className="holo-card__glare" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolographicPokemonCard;
