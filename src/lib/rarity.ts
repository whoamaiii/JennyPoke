import { CardData } from '@/types/pokemon';

type NormalizedRarity = CardData['rarity'];

const RARITY_CACHE_KEY = 'rarity_cache_v1';

function readCache(): Record<string, NormalizedRarity> {
  try {
    const raw = sessionStorage.getItem(RARITY_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(map: Record<string, NormalizedRarity>) {
  try {
    sessionStorage.setItem(RARITY_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const inMemoryCache: Record<string, NormalizedRarity> = {};

export function normalizeRarity(rarity: string): NormalizedRarity {
  const r = (rarity || '').toLowerCase();
  if (r.includes('common')) return 'common';
  if (r.includes('uncommon')) return 'uncommon';
  if (r.includes('rare') && !r.includes('ultra')) return 'rare';
  return 'ultra-rare';
}

export async function fetchCardRarity(cardId: string, signal?: AbortSignal): Promise<NormalizedRarity | null> {
  // Check memory cache
  if (inMemoryCache[cardId]) return inMemoryCache[cardId];
  // Check session cache
  const sessionCache = readCache();
  if (sessionCache[cardId]) {
    inMemoryCache[cardId] = sessionCache[cardId];
    return sessionCache[cardId];
  }

  try {
    const resp = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, { signal });
    if (!resp.ok) return null;
    const data = await resp.json();
    const rarity = normalizeRarity(data?.data?.rarity || 'common');
    inMemoryCache[cardId] = rarity;
    sessionCache[cardId] = rarity;
    writeCache(sessionCache);
    return rarity;
  } catch {
    return null;
  }
}

export async function getRarityForCardData(card: CardData, signal?: AbortSignal): Promise<NormalizedRarity> {
  // If explicit rare/ultra provided, trust it
  if (card.rarity === 'rare' || card.rarity === 'ultra-rare') return card.rarity;
  // If card has a rarity string in its tcg data, normalize it
  if ((card as any).card?.rarity && typeof (card as any).card.rarity === 'string') {
    return normalizeRarity((card as any).card.rarity as string);
  }
  // If likely a session card, fetch by ID
  const isSessionCard = (card as any).isSessionCard === true;
  if (!isSessionCard) return card.rarity || 'common';
  const fetched = await fetchCardRarity(card.card.id, signal);
  return fetched ?? (card.rarity || 'common');
}

export async function fetchRaritiesForCards(cards: CardData[], signal?: AbortSignal): Promise<Record<string, NormalizedRarity>> {
  const results: Record<string, NormalizedRarity> = {};
  await Promise.all(cards.map(async (c) => {
    const r = await getRarityForCardData(c, signal);
    results[c.card.id] = r;
  }));
  return results;
}

export function computePackTierFromRarities(rarityById: Record<string, NormalizedRarity>): 'standard' | 'rare' | 'ultra' {
  const values = Object.values(rarityById);
  if (values.some(r => r === 'ultra-rare')) return 'ultra';
  if (values.some(r => r === 'rare')) return 'rare';
  return 'standard';
}

export function computePackTierFromKnown(cards: CardData[]): 'standard' | 'rare' | 'ultra' {
  for (const c of cards) {
    if (c.rarity === 'ultra-rare') return 'ultra';
  }
  for (const c of cards) {
    if (c.rarity === 'rare') return 'rare';
  }
  return 'standard';
}

export async function computePackVariant(cards: CardData[], signal?: AbortSignal): Promise<'standard' | 'rare' | 'ultra'> {
  const rarityMap = await fetchRaritiesForCards(cards, signal);
  return computePackTierFromRarities(rarityMap);
}


