import { PackType, CardData, RarityWeights } from '@/types/pokemon';

/**
 * Generate a pack of cards with proper rarity distribution
 */
export function generatePackWithWeights(
  availableCards: CardData[],
  packType: PackType
): CardData[] {
  const pack: CardData[] = [];
  const { cardCount, rarityWeights, guaranteedRare } = packType;

  // Categorize available cards by rarity
  const cardsByRarity = {
    'common': availableCards.filter(c => c.rarity === 'common'),
    'uncommon': availableCards.filter(c => c.rarity === 'uncommon'),
    'rare': availableCards.filter(c => c.rarity === 'rare'),
    'ultra-rare': availableCards.filter(c => c.rarity === 'ultra-rare'),
  };

  console.log('[PackGenerator] Available cards by rarity:', {
    common: cardsByRarity.common.length,
    uncommon: cardsByRarity.uncommon.length,
    rare: cardsByRarity.rare.length,
    'ultra-rare': cardsByRarity['ultra-rare'].length,
  });

  // If guaranteed rare, ensure at least one rare or better
  if (guaranteedRare) {
    const rareCard = getRandomRareCard(cardsByRarity);
    if (rareCard) {
      pack.push(rareCard);
      console.log('[PackGenerator] Added guaranteed rare:', rareCard.card.name, rareCard.rarity);
    }
  }

  // Fill remaining slots with weighted random selection
  const remainingSlots = cardCount - pack.length;

  for (let i = 0; i < remainingSlots; i++) {
    const card = selectCardByWeight(cardsByRarity, rarityWeights, pack);
    if (card) {
      pack.push(card);
    }
  }

  console.log('[PackGenerator] Generated pack:', {
    total: pack.length,
    common: pack.filter(c => c.rarity === 'common').length,
    uncommon: pack.filter(c => c.rarity === 'uncommon').length,
    rare: pack.filter(c => c.rarity === 'rare').length,
    'ultra-rare': pack.filter(c => c.rarity === 'ultra-rare').length,
  });

  return pack;
}

/**
 * Get a random rare or ultra-rare card for guaranteed rare packs
 */
function getRandomRareCard(cardsByRarity: Record<string, CardData[]>): CardData | null {
  // Try ultra-rare first (10% chance), then rare
  const rand = Math.random();

  if (rand < 0.1 && cardsByRarity['ultra-rare'].length > 0) {
    return getRandomCard(cardsByRarity['ultra-rare']);
  } else if (cardsByRarity.rare.length > 0) {
    return getRandomCard(cardsByRarity.rare);
  } else if (cardsByRarity['ultra-rare'].length > 0) {
    return getRandomCard(cardsByRarity['ultra-rare']);
  }

  return null;
}

/**
 * Select a card based on rarity weights
 */
function selectCardByWeight(
  cardsByRarity: Record<string, CardData[]>,
  weights: RarityWeights,
  excludeCards: CardData[]
): CardData | null {
  const rand = Math.random();
  const excludeIds = new Set(excludeCards.map(c => c.id));

  let cumulativeWeight = 0;
  const rarityOrder: Array<keyof RarityWeights> = ['ultra-rare', 'rare', 'uncommon', 'common'];

  for (const rarity of rarityOrder) {
    cumulativeWeight += weights[rarity];

    if (rand < cumulativeWeight) {
      // Try to get a card of this rarity
      const availableCards = cardsByRarity[rarity].filter(c => !excludeIds.has(c.id));

      if (availableCards.length > 0) {
        return getRandomCard(availableCards);
      }
      // If no cards of this rarity available, fall through to next rarity
    }
  }

  // Fallback: get any available card
  for (const rarity of rarityOrder) {
    const availableCards = cardsByRarity[rarity].filter(c => !excludeIds.has(c.id));
    if (availableCards.length > 0) {
      return getRandomCard(availableCards);
    }
  }

  return null;
}

/**
 * Get a random card from an array
 */
function getRandomCard(cards: CardData[]): CardData {
  return cards[Math.floor(Math.random() * cards.length)];
}

/**
 * Analyze pack contents for display
 */
export function analyzePackContents(pack: CardData[]): {
  hasRare: boolean;
  hasUltraRare: boolean;
  rareCount: number;
  ultraRareCount: number;
  rareCards: CardData[];
} {
  const rareCards = pack.filter(c => c.rarity === 'rare');
  const ultraRareCards = pack.filter(c => c.rarity === 'ultra-rare');

  return {
    hasRare: rareCards.length > 0,
    hasUltraRare: ultraRareCards.length > 0,
    rareCount: rareCards.length,
    ultraRareCount: ultraRareCards.length,
    rareCards: [...rareCards, ...ultraRareCards],
  };
}
