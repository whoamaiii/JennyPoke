import axios from 'axios';
import { PokemonTCGCard, CardData } from '@/types/pokemon';

const API_BASE = 'https://api.pokemontcg.io/v2';

// Get API key from window if available
const getHeaders = () => {
  const apiKey = (window as any).POKEMON_API_KEY;
  return apiKey ? { 'X-Api-Key': apiKey } : {};
};

const normalizeRarity = (rarity: string): CardData['rarity'] => {
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('common')) return 'common';
  if (rarityLower.includes('uncommon')) return 'uncommon';
  if (rarityLower.includes('rare') && !rarityLower.includes('ultra')) return 'rare';
  return 'ultra-rare';
};

export const getCardsByRarity = async (rarity: string, limit: number = 10): Promise<PokemonTCGCard[]> => {
  try {
    const response = await axios.get(`${API_BASE}/cards`, {
      headers: getHeaders(),
      params: {
        q: `rarity:"${rarity}"`,
        pageSize: limit,
        orderBy: '-set.releaseDate',
      },
    });
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching cards by rarity ${rarity}:`, error);
    return [];
  }
};

export const getRandomPack = async (): Promise<CardData[]> => {
  try {
    // Fetch cards by rarity with larger pools
    const [commonCards, uncommonCards, rareCards] = await Promise.all([
      getCardsByRarity('Common', 50),
      getCardsByRarity('Uncommon', 30),
      getCardsByRarity('Rare', 20),
    ]);

    // Shuffle and pick cards
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const pack: CardData[] = [];
    const usedIds = new Set<string>();

    // Add 6 commons
    const shuffledCommons = shuffleArray(commonCards);
    for (let i = 0; i < 6 && i < shuffledCommons.length; i++) {
      const card = shuffledCommons[i];
      if (!usedIds.has(card.id)) {
        pack.push({
          id: `${card.id}-${Date.now()}-${Math.random()}`,
          card,
          rarity: 'common',
        });
        usedIds.add(card.id);
      }
    }

    // Add 3 uncommons
    const shuffledUncommons = shuffleArray(uncommonCards);
    for (let i = 0; i < 3 && i < shuffledUncommons.length; i++) {
      const card = shuffledUncommons[i];
      if (!usedIds.has(card.id)) {
        pack.push({
          id: `${card.id}-${Date.now()}-${Math.random()}`,
          card,
          rarity: 'uncommon',
        });
        usedIds.add(card.id);
      }
    }

    // Add 1 rare or better
    const shuffledRares = shuffleArray(rareCards);
    if (shuffledRares.length > 0) {
      const card = shuffledRares[0];
      pack.push({
        id: `${card.id}-${Date.now()}-${Math.random()}`,
        card,
        rarity: normalizeRarity(card.rarity),
      });
    }

    return pack;
  } catch (error) {
    console.error('Error generating random pack:', error);
    // Return empty pack on error
    return [];
  }
};

export const openPack = getRandomPack;
