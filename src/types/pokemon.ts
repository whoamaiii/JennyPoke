export interface PokemonTCGCard {
  id: string;
  name: string;
  set: {
    name: string;
  };
  number: string;
  rarity: string;
  images: {
    small: string;
    large: string;
  };
  supertype?: string;
  hp?: string;
  types?: string[];
  attacks?: Array<{
    name: string;
    damage: string;
  }>;
}

export interface CardData {
  id: string;
  card: PokemonTCGCard;
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra-rare';
}
