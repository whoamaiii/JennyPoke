import { CardData } from '@/types/pokemon';
import { cn } from '@/lib/utils';
import cardBackImage from '@/assets/pokemon-card-back.png';

interface PokemonCardProps {
  card: CardData;
  className?: string;
  style?: React.CSSProperties;
  showBack?: boolean;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  'ultra-rare': 'from-purple-400 via-pink-500 to-yellow-500',
};

export const PokemonCard = ({ card, className, style, showBack = false }: PokemonCardProps) => {
  const { card: tcgCard, rarity } = card;

  if (showBack) {
    return (
      <div
        className={cn(
          'relative w-80 h-[28rem] rounded-2xl overflow-hidden shadow-2xl',
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

  return (
    <div
      className={cn(
        'relative w-80 h-[28rem] rounded-2xl overflow-hidden shadow-2xl',
        'bg-card',
        className
      )}
      style={style}
    >
      {/* Rarity border */}
      <div className={cn('absolute inset-0 p-1 rounded-2xl bg-gradient-to-br', rarityColors[rarity])}>
        <div className="w-full h-full rounded-xl bg-card overflow-hidden">
          <img
            src={tcgCard.images.large}
            alt={tcgCard.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
