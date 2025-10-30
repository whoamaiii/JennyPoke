// Holographic card utility functions

/**
 * Determine if a card should have holographic effects
 */
export const isHolographicCard = (rarity: string, tcgCard: any): boolean => {
  const rarityLower = rarity?.toLowerCase() || '';
  const tcgRarity = tcgCard?.rarity?.toLowerCase() || '';

  // Check if it's a custom card (always holographic)
  if ('isCustom' in tcgCard && tcgCard.isCustom) return true;

  // Check if it's any type of holo or rare card
  return rarityLower.includes('holo') ||
         rarityLower.includes('rare') ||
         tcgRarity.includes('holo') ||
         tcgRarity.includes('rare') ||
         tcgRarity.includes('secret') ||
         tcgRarity.includes('ultra');
};

/**
 * Map rarity to data attribute for CSS styling
 */
export const mapRarityToDataAttr = (rarity: string, tcgCard: any): string => {
  const rarityLower = rarity?.toLowerCase() || '';
  const tcgRarity = tcgCard?.rarity?.toLowerCase() || '';

  // Check custom card data for special effects
  if ('customData' in tcgCard) {
    const customData = tcgCard.customData;
    // Ultra-rare custom cards get cosmos effect
    if (customData?.category === 'ultra-rare' || customData?.assignedDay === 24) {
      return 'rare holo cosmos';
    }
  }

  // Map other rarities
  if (rarityLower.includes('cosmos') || tcgRarity.includes('cosmos')) return 'rare holo cosmos';
  if (rarityLower.includes('rainbow') || tcgRarity.includes('rainbow')) return 'rare rainbow';
  if (rarityLower.includes('reverse') || tcgRarity.includes('reverse')) return 'reverse holo';
  if (rarityLower.includes('holo') || tcgRarity.includes('holo')) return 'rare holo';
  if (rarityLower.includes('rare') || tcgRarity.includes('rare')) return 'rare holo';

  return '';
};

/**
 * Get Pokemon type class for type-based glow colors
 */
export const getTypeClass = (tcgCard: any): string => {
  const types = tcgCard?.types || [];
  if (types.length === 0) return 'colorless';

  // Return first type, mapped to lowercase
  const type = types[0].toLowerCase();

  // Map TCG API types to CSS classes
  const typeMap: Record<string, string> = {
    'fire': 'fire',
    'water': 'water',
    'grass': 'grass',
    'lightning': 'lightning',
    'electric': 'lightning', // Alternative name
    'psychic': 'psychic',
    'fighting': 'fighting',
    'darkness': 'darkness',
    'dark': 'darkness', // Alternative name
    'metal': 'metal',
    'steel': 'metal', // Alternative name
    'dragon': 'dragon',
    'fairy': 'fairy',
    'colorless': 'colorless',
    'normal': 'colorless' // Alternative name
  };

  return typeMap[type] || 'colorless';
};
