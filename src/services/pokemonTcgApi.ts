import axios from 'axios';
import { PokemonTCGCard, CardData } from '@/types/pokemon';

const API_BASE = 'https://api.pokemontcg.io/v2';

// Get API key from window if available
const getHeaders = () => {
  // Prefer build-time Vite env var VITE_POKEMON_API_KEY, fall back to window global for runtime injection
  const apiKey = (import.meta as any).env?.VITE_POKEMON_API_KEY || (window as any).POKEMON_API_KEY;
  return apiKey ? { 'X-Api-Key': apiKey } : {};
};

const getRandomSet = async () => {
  try {
    const response = await axios.get(`${API_BASE}/sets`, {
      headers: getHeaders(),
      params: {
        pageSize: 1,
        orderBy: '-releaseDate',
        q: 'legalities.standard:legal', // only standard legal sets
      },
    });
    const sets = response.data.data || [];
    if (sets.length > 0) {
      return sets[0];
    }
  } catch (error) {
    console.error('Error fetching random set:', error);
  }
  return null;
};

const normalizeRarity = (rarity: string): CardData['rarity'] => {
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('common')) return 'common';
  if (rarityLower.includes('uncommon')) return 'uncommon';
  if (rarityLower.includes('rare') && !rarityLower.includes('ultra')) return 'rare';
  return 'ultra-rare';
};

const generatePack = (commonCards: PokemonTCGCard[], uncommonCards: PokemonTCGCard[], rareCards: PokemonTCGCard[]): CardData[] => {
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

  // Randomly decide pack composition (total 8 cards)
  const numRares = Math.random() < 0.7 ? 1 : 0; // 70% chance of 1 rare
  const numUncommons = Math.floor(Math.random() * 3) + 1; // 1-3 uncommons
  const numCommons = 8 - numRares - numUncommons;

  // Add commons
  const shuffledCommons = shuffleArray(commonCards);
  for (let i = 0; i < numCommons && i < shuffledCommons.length; i++) {
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

  // Add uncommons
  const shuffledUncommons = shuffleArray(uncommonCards);
  for (let i = 0; i < numUncommons && i < shuffledUncommons.length; i++) {
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

  // Add rare(s)
  if (numRares > 0) {
    const shuffledRares = shuffleArray(rareCards);
    for (let i = 0; i < numRares && i < shuffledRares.length; i++) {
      const card = shuffledRares[i];
      if (!usedIds.has(card.id)) {
        pack.push({
          id: `${card.id}-${Date.now()}-${Math.random()}`,
          card,
          rarity: normalizeRarity(card.rarity),
        });
        usedIds.add(card.id);
      }
    }
  }

  // If pack is short, fill with more commons
  while (pack.length < 8 && shuffledCommons.length > pack.length) {
    const card = shuffledCommons[pack.length];
    if (card && !usedIds.has(card.id)) {
      pack.push({
        id: `${card.id}-${Date.now()}-${Math.random()}`,
        card,
        rarity: 'common',
      });
      usedIds.add(card.id);
    }
  }

  return pack;
};

export const getCardsByRarity = async (rarity: string, limit: number = 10, setId?: string): Promise<PokemonTCGCard[]> => {
  try {
    const params: { q: string; pageSize: number; orderBy?: string } = {
      q: `rarity:"${rarity}"`,
      pageSize: Math.min(limit, 25), // cap to 25 to keep response sizes small
    };
    if (setId) {
      params.q += ` set.id:"${setId}"`;
    } else {
      params.orderBy = '-set.releaseDate';
    }
    const response = await axios.get(`${API_BASE}/cards`, {
      headers: getHeaders(),
      params,
    });
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching cards by rarity ${rarity}:`, error);
    return [];
  }
};

export const getRandomPack = async (): Promise<CardData[]> => {
  try {
    // Get a random set
    const randomSet = await getRandomSet();
    const setId = randomSet?.id;

    // Fetch cards by rarity from the same set
    const [commonCards, uncommonCards, rareCards] = await Promise.all([
      getCardsByRarity('Common', 20, setId),
      getCardsByRarity('Uncommon', 12, setId),
      getCardsByRarity('Rare', 8, setId),
    ]);

    // If not enough cards from set, fall back to general
    if (commonCards.length < 5 || uncommonCards.length < 2) {
      // Fall back to general cards
      const [fallbackCommons, fallbackUncommons, fallbackRares] = await Promise.all([
        getCardsByRarity('Common', 20),
        getCardsByRarity('Uncommon', 12),
        getCardsByRarity('Rare', 8),
      ]);
      return generatePack(fallbackCommons, fallbackUncommons, fallbackRares);
    }

    return generatePack(commonCards, uncommonCards, rareCards);
  } catch (error) {
    console.error('Error generating random pack:', error);
    // Return empty pack on error
    return [];
  }
};

export const openPack = getRandomPack;
