import { Pokemon, CardData } from '@/types/pokemon';

const API_BASE = 'https://pokeapi.co/api/v2';

export const getRandomPokemon = async (): Promise<Pokemon> => {
  const randomId = Math.floor(Math.random() * 898) + 1; // Gen 1-8
  const response = await fetch(`${API_BASE}/pokemon/${randomId}`);
  const data = await response.json();
  return data;
};

const getRarity = (): CardData['rarity'] => {
  const roll = Math.random();
  if (roll < 0.5) return 'common';
  if (roll < 0.8) return 'uncommon';
  if (roll < 0.95) return 'rare';
  return 'ultra-rare';
};

export const openPack = async (): Promise<CardData[]> => {
  const promises = Array.from({ length: 10 }, async () => {
    const pokemon = await getRandomPokemon();
    return {
      id: `${pokemon.id}-${Date.now()}-${Math.random()}`,
      pokemon,
      rarity: getRarity(),
    };
  });
  
  return Promise.all(promises);
};
