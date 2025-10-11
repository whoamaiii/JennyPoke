import axios, { AxiosError } from 'axios';
import { PokemonTCGCard, CardData } from '@/types/pokemon';

const API_BASE = 'https://api.pokemontcg.io/v2';
const API_TIMEOUT = 400000; // 400 seconds (6.67 minutes) timeout - more than double the observed 139.2s response time

// Cache keys
const CACHE_KEYS = {
  SETS: 'pokemon_sets_cache',
  CARDS: 'pokemon_cards_cache',
  CACHE_TIMESTAMP: 'pokemon_cache_timestamp',
};

// Cache duration (24 hours in milliseconds)
const CACHE_DURATION = 48 * 60 * 60 * 1000;

// Cache management functions
const getCache = (key: string) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const setCache = (key: string, data: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
};

const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const clearExpiredCache = () => {
  const timestamp = getCache(CACHE_KEYS.CACHE_TIMESTAMP);
  if (!timestamp || !isCacheValid(timestamp)) {
    sessionStorage.removeItem(CACHE_KEYS.SETS);
    sessionStorage.removeItem(CACHE_KEYS.CARDS);
    sessionStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
  }
};

// Manual cache clearing function (exported for potential use)
export const clearCache = () => {
  sessionStorage.removeItem(CACHE_KEYS.SETS);
  sessionStorage.removeItem(CACHE_KEYS.CARDS);
  sessionStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
};

// Custom error types for better error handling
export class PokemonTCGError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'NETWORK' | 'API_ERROR' | 'NO_DATA' | 'UNKNOWN',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PokemonTCGError';
  }
}

// Get API key from window if available
const getHeaders = () => {
  // Prefer build-time Vite env var VITE_POKEMON_API_KEY, fall back to window global for runtime injection
  const apiKey = (import.meta.env as Record<string, string | undefined>).VITE_POKEMON_API_KEY ||
                 (window as unknown as Record<string, string | undefined>).POKEMON_API_KEY;
  return apiKey ? { 'X-Api-Key': apiKey } : {};
};

// Get headers without API key (for fallback)
const getHeadersWithoutApiKey = () => ({});

// Helper function to make API requests with fallback
const makeApiRequest = async (config: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}): Promise<import('axios').AxiosResponse> => {
  console.log(`🌐 Making API request to: ${config.url}`);
  const startTime = Date.now();

  // First try with API key
  try {
    const response = await axios({
      ...config,
      headers: { ...config.headers, ...getHeaders() },
      timeout: API_TIMEOUT,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ API request completed in ${duration}s (with API key)`);
    return response;
  } catch (error) {
    // If it's an authentication error (401/403), try again without API key
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      console.log('🔑 API key failed, trying without API key...');
      try {
        const response = await axios({
          ...config,
          headers: { ...config.headers, ...getHeadersWithoutApiKey() },
          timeout: API_TIMEOUT,
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ API request completed in ${duration}s (fallback without API key)`);
        return response;
      } catch (fallbackError) {
        // If fallback also fails, throw the original error
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`❌ API request failed after ${duration}s:`, fallbackError);
        throw error;
      }
    }
    // If it's not an auth error, throw the original error
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ API request failed after ${duration}s:`, error);
    throw error;
  }
};

// Helper function to handle axios errors and convert to custom errors
const handleApiError = (error: unknown, operation: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      throw new PokemonTCGError(
        'Request timed out after waiting 7 minutes. The Pokémon TCG API may be experiencing delays.',
        'TIMEOUT',
        axiosError
      );
    }

    if (!axiosError.response) {
      throw new PokemonTCGError(
        'Unable to connect to the server. Please check your internet connection.',
        'NETWORK',
        axiosError
      );
    }

    const status = axiosError.response.status;
    if (status === 429) {
      throw new PokemonTCGError(
        'Too many requests. Please wait a moment and try again.',
        'API_ERROR',
        axiosError
      );
    }

    if (status >= 500) {
      throw new PokemonTCGError(
        'Server error. Please try again later.',
        'API_ERROR',
        axiosError
      );
    }

    if (status === 401 || status === 403) {
      throw new PokemonTCGError(
        'API access denied. Please check your API key.',
        'API_ERROR',
        axiosError
      );
    }

    throw new PokemonTCGError(
      `API error (${status}). Please try again later.`,
      'API_ERROR',
      axiosError
    );
  }

  throw new PokemonTCGError(
    `Unexpected error during ${operation}. Please try again.`,
    'UNKNOWN',
    error
  );
};

const getRandomSet = async () => {
  // Clear expired cache on first call
  clearExpiredCache();

  // Check cache first
  let sets = getCache(CACHE_KEYS.SETS);
  if (!sets) {
    console.log('🔄 Fetching sets from API...');
    try {
      // Fetch all standard legal sets
      const response = await makeApiRequest({
        url: `${API_BASE}/sets`,
        method: 'GET',
        params: {
          q: 'legalities.standard:legal', // only standard legal sets
          orderBy: '-releaseDate',
        },
      });
      sets = response.data.data || [];
      if (sets.length > 0) {
        setCache(CACHE_KEYS.SETS, sets);
        setCache(CACHE_KEYS.CACHE_TIMESTAMP, Date.now());
        console.log(`💾 Cached ${sets.length} sets`);
      }
    } catch (error) {
      handleApiError(error, 'fetching sets');
    }
  } else {
    console.log(`📋 Using cached sets (${sets.length} available)`);
  }

  if (!sets || sets.length === 0) {
    throw new PokemonTCGError('No sets available', 'NO_DATA');
  }

  // Pick a random set from the available sets
  const randomIndex = Math.floor(Math.random() * sets.length);
  const selectedSet = sets[randomIndex];
  console.log(`🎲 Selected set: ${selectedSet.name} (${selectedSet.id})`);
  return selectedSet;
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
  // Clear expired cache on first call
  clearExpiredCache();

  // Create cache key for this specific request
  const cacheKey = setId ? `${setId}_${rarity}` : `general_${rarity}`;

  // Check cache first
  const cachedCards = getCache(`${CACHE_KEYS.CARDS}_${cacheKey}`);
  if (cachedCards && Array.isArray(cachedCards) && cachedCards.length >= limit) {
    // Return cached cards, but shuffle them to provide variety
    const shuffled = [...cachedCards].sort(() => Math.random() - 0.5);
    console.log(`📋 Using cached ${rarity} cards (${setId ? `set: ${setId}` : 'general'}) - ${shuffled.slice(0, limit).length} cards`);
    return shuffled.slice(0, limit);
  }

  console.log(`🔄 Fetching ${rarity} cards from API${setId ? ` (set: ${setId})` : ' (general)'}...`);
  try {
    const params: Record<string, string | number | boolean> = {
      q: `rarity:"${rarity}"`,
      pageSize: Math.min(limit, 25), // cap to 25 to keep response sizes small
    };
    if (setId) {
      params.q += ` set.id:"${setId}"`;
    } else {
      params.orderBy = '-set.releaseDate';
    }
    const response = await makeApiRequest({
      url: `${API_BASE}/cards`,
      method: 'GET',
      params,
    });
    const cards = response.data.data || [];

    // Cache the results
    if (cards.length > 0) {
      setCache(`${CACHE_KEYS.CARDS}_${cacheKey}`, cards);
      console.log(`💾 Cached ${cards.length} ${rarity} cards`);
    }

    return cards;
  } catch (error) {
    handleApiError(error, `fetching ${rarity} cards`);
  }
};

export const getRandomPack = async (): Promise<CardData[]> => {
  try {
    // Get a random set
    const randomSet = await getRandomSet();
    if (!randomSet) {
      throw new PokemonTCGError('Unable to find a valid card set. Please try again.', 'NO_DATA');
    }
    const setId = randomSet.id;

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

      if (fallbackCommons.length < 5) {
        throw new PokemonTCGError('Not enough cards available. Please try again later.', 'NO_DATA');
      }

      return generatePack(fallbackCommons, fallbackUncommons, fallbackRares);
    }

    return generatePack(commonCards, uncommonCards, rareCards);
  } catch (error) {
    if (error instanceof PokemonTCGError) {
      throw error; // Re-throw our custom errors
    }
    // Handle any other unexpected errors
    throw new PokemonTCGError(
      'An unexpected error occurred while opening your pack. Please try again.',
      'UNKNOWN',
      error
    );
  }
};

export const openPack = getRandomPack;

// Temporary test function to verify API key
export const testApiKey = async () => {
  try {
    await getRandomSet();
    return true;
  } catch (error) {
    return false;
  }
};
