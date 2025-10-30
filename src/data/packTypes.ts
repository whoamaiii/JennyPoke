import { PackType } from '@/types/pokemon';

/**
 * Predefined pack types with different rarity distributions and designs
 */
export const PACK_TYPES: PackType[] = [
  {
    id: 'standard-booster',
    name: 'Standard Booster',
    description: 'Classic 8-card pack with balanced rarity odds',
    design: 'standard',
    cardCount: 8,
    rarityWeights: {
      common: 0.60,      // 60% - ~5 commons per pack
      uncommon: 0.30,    // 30% - ~2 uncommons per pack
      rare: 0.08,        // 8%  - occasional rare
      'ultra-rare': 0.02 // 2%  - very rare
    },
    guaranteedRare: false,
  },
  {
    id: 'premium-pack',
    name: 'Premium Pack',
    description: 'Guaranteed rare card with better odds for ultra-rares',
    design: 'premium',
    cardCount: 10,
    rarityWeights: {
      common: 0.45,      // 45% - ~4-5 commons
      uncommon: 0.35,    // 35% - ~3-4 uncommons
      rare: 0.15,        // 15% - good rare chance
      'ultra-rare': 0.05 // 5%  - better ultra-rare odds
    },
    guaranteedRare: true,
  },
  {
    id: 'ultra-premium',
    name: 'Ultra Premium',
    description: 'Maximum rarity! Multiple rares guaranteed',
    design: 'ultra',
    cardCount: 12,
    rarityWeights: {
      common: 0.30,      // 30% - fewer commons
      uncommon: 0.35,    // 35% - balanced uncommons
      rare: 0.25,        // 25% - high rare chance
      'ultra-rare': 0.10 // 10% - excellent ultra-rare odds
    },
    guaranteedRare: true,
  },
  {
    id: 'mystery-pack',
    name: 'Mystery Pack',
    description: 'Unpredictable! Could be amazing or disappointing...',
    design: 'mystery',
    cardCount: 8,
    rarityWeights: {
      common: 0.50,      // 50% - variable
      uncommon: 0.25,    // 25% - variable
      rare: 0.15,        // 15% - decent odds
      'ultra-rare': 0.10 // 10% - high risk, high reward!
    },
    guaranteedRare: false,
  },
];

/**
 * Get pack type by ID
 */
export const getPackTypeById = (id: string): PackType | undefined => {
  return PACK_TYPES.find((pack) => pack.id === id);
};

/**
 * Get default pack type
 */
export const getDefaultPackType = (): PackType => {
  return PACK_TYPES[0]; // Standard booster
};
