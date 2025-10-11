import { CardData } from '@/types/pokemon';
import { cn } from '@/lib/utils';

interface PokemonCardProps {
  card: CardData;
  className?: string;
  style?: React.CSSProperties;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  'ultra-rare': 'from-purple-400 via-pink-500 to-yellow-500',
};

const typeColors: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-cyan-300',
  fighting: 'bg-red-600',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-700',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-600',
  dark: 'bg-gray-700',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

export const PokemonCard = ({ card, className, style }: PokemonCardProps) => {
  const { pokemon, rarity } = card;
  const primaryType = pokemon.types[0].type.name;

  return (
    <div
      className={cn(
        'relative w-80 h-[28rem] rounded-2xl overflow-hidden shadow-2xl',
        'bg-gradient-to-br from-card to-card/90 backdrop-blur',
        className
      )}
      style={style}
    >
      {/* Rarity border */}
      <div className={cn('absolute inset-0 p-1 rounded-2xl bg-gradient-to-br', rarityColors[rarity])}>
        <div className="w-full h-full rounded-xl bg-card" />
      </div>

      {/* Card content */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold capitalize">{pokemon.name}</h2>
            <p className="text-sm text-muted-foreground">HP {pokemon.stats[0].base_stat}</p>
          </div>
          <div className="flex gap-1">
            {pokemon.types.map((type) => (
              <span
                key={type.type.name}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold text-white',
                  typeColors[type.type.name] || 'bg-gray-400'
                )}
              >
                {type.type.name}
              </span>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-2xl" />
          <img
            src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
            alt={pokemon.name}
            className="w-56 h-56 object-contain relative z-10 drop-shadow-2xl"
          />
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attack:</span>
              <span className="font-semibold">{pokemon.stats[1].base_stat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Defense:</span>
              <span className="font-semibold">{pokemon.stats[2].base_stat}</span>
            </div>
          </div>
          
          {/* Rarity badge */}
          <div className="flex justify-center pt-2">
            <span className={cn(
              'px-4 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r',
              rarityColors[rarity]
            )}>
              {rarity.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
