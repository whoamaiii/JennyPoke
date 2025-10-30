import { CustomCardGenerator } from './customCardGenerator';
import { CustomPokemonCard, PokemonTCGCard, CardData } from '@/types/pokemon';
import axios from 'axios';

const POKEMON_TCG_API_KEY = import.meta.env.VITE_POKEMON_TCG_API_KEY || '541aca44-b8f0-40f0-8149-4f0d9362eb72';

interface PackDistribution {
  customCards: number;
  rares: number;
  uncommons: number;
  commons: number;
  totalCards: number;
}

export class AdventPackGenerator {
  /**
   * Get the card distribution for a specific day
   * Special days get more custom cards and rarer regular cards
   */
  private static getDayDistribution(day: number): PackDistribution {
    const customCardCount = CustomCardGenerator.getCustomCardCount(day);

    // Christmas Eve (Day 24) - Ultra special
    if (day === 24) {
      return {
        customCards: customCardCount,
        rares: 2,
        uncommons: 3,
        commons: Math.max(0, 10 - customCardCount - 5),
        totalCards: 10
      };
    }

    // Final week (Days 20-23) - Very special
    if (day >= 20) {
      return {
        customCards: customCardCount,
        rares: 1,
        uncommons: 3,
        commons: Math.max(0, 10 - customCardCount - 4),
        totalCards: 10
      };
    }

    // Mid-December (Days 14-19) - Special
    if (day >= 14) {
      return {
        customCards: customCardCount,
        rares: 1,
        uncommons: 2,
        commons: Math.max(0, 10 - customCardCount - 3),
        totalCards: 10
      };
    }

    // Early December (Days 1-13) - Standard
    return {
      customCards: customCardCount,
      rares: 0,
      uncommons: 2,
      commons: Math.max(0, 10 - customCardCount - 2),
      totalCards: 10
    };
  }

  /**
   * Fetch random cards from Pokemon TCG API based on rarity
   */
  private static async fetchRegularCards(
    rarity: string,
    count: number
  ): Promise<PokemonTCGCard[]> {
    if (count <= 0) return [];

    try {
      const response = await axios.get(
        'https://api.pokemontcg.io/v2/cards',
        {
          params: {
            q: `rarity:"${rarity}"`,
            pageSize: count * 2, // Fetch extra to ensure variety
            orderBy: 'set.releaseDate'
          },
          headers: {
            'X-Api-Key': POKEMON_TCG_API_KEY
          }
        }
      );

      const cards = response.data.data;
      // Shuffle and return the requested count
      return this.shuffleArray(cards).slice(0, count);
    } catch (error) {
      console.error(`Error fetching ${rarity} cards:`, error);
      return [];
    }
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Convert PokemonTCGCard to CardData format
   */
  private static convertToCardData(
    cards: (PokemonTCGCard | CustomPokemonCard)[],
    rarityMap?: Map<string, 'common' | 'uncommon' | 'rare' | 'ultra-rare'>
  ): CardData[] {
    return cards.map(card => {
      // Determine rarity
      let rarity: 'common' | 'uncommon' | 'rare' | 'ultra-rare' = 'common';

      if (rarityMap && rarityMap.has(card.id)) {
        rarity = rarityMap.get(card.id)!;
      } else if ('isCustom' in card && card.isCustom) {
        rarity = 'ultra-rare'; // All custom cards are ultra-rare
      } else {
        const cardRarity = card.rarity.toLowerCase();
        if (cardRarity.includes('rare') || cardRarity.includes('holo')) {
          rarity = 'rare';
        } else if (cardRarity.includes('uncommon')) {
          rarity = 'uncommon';
        } else {
          rarity = 'common';
        }
      }

      return {
        id: card.id,
        card: card,
        rarity
      };
    });
  }

  /**
   * Generate a complete advent pack for a specific day
   */
  static async generateAdventPack(day: number): Promise<CardData[]> {
    console.log(`[AdventPackGenerator] Generating pack for day ${day}`);

    const distribution = this.getDayDistribution(day);
    console.log(`[AdventPackGenerator] Distribution:`, distribution);

    const pack: (PokemonTCGCard | CustomPokemonCard)[] = [];
    const rarityMap = new Map<string, 'common' | 'uncommon' | 'rare' | 'ultra-rare'>();

    try {
      // 1. Add custom cards first
      if (distribution.customCards > 0) {
        console.log(`[AdventPackGenerator] Generating ${distribution.customCards} custom cards`);
        try {
          const customCards = await CustomCardGenerator.generateCardsForDay(day);
          if (customCards.length > 0) {
            pack.push(...customCards);
            // Mark all custom cards as ultra-rare
            customCards.forEach(card => rarityMap.set(card.id, 'ultra-rare'));
            console.log(`[AdventPackGenerator] Successfully added ${customCards.length} custom cards`);
          } else {
            console.warn(`[AdventPackGenerator] No custom cards generated for day ${day}`);
          }
        } catch (error) {
          console.error(`[AdventPackGenerator] Error generating custom cards for day ${day}:`, error);
          // Continue with regular cards even if custom cards fail
        }
      }

      // 2. Fetch and add rare cards
      if (distribution.rares > 0) {
        console.log(`[AdventPackGenerator] Fetching ${distribution.rares} rare cards`);
        try {
          const rareCards = await this.fetchRegularCards('Rare', distribution.rares);
          if (rareCards.length > 0) {
            pack.push(...rareCards);
            rareCards.forEach(card => rarityMap.set(card.id, 'rare'));
          }
        } catch (error) {
          console.error(`[AdventPackGenerator] Error fetching rare cards:`, error);
        }
      }

      // 3. Fetch and add uncommon cards
      if (distribution.uncommons > 0) {
        console.log(`[AdventPackGenerator] Fetching ${distribution.uncommons} uncommon cards`);
        try {
          const uncommonCards = await this.fetchRegularCards('Uncommon', distribution.uncommons);
          if (uncommonCards.length > 0) {
            pack.push(...uncommonCards);
            uncommonCards.forEach(card => rarityMap.set(card.id, 'uncommon'));
          }
        } catch (error) {
          console.error(`[AdventPackGenerator] Error fetching uncommon cards:`, error);
        }
      }

      // 4. Fetch and add common cards
      if (distribution.commons > 0) {
        console.log(`[AdventPackGenerator] Fetching ${distribution.commons} common cards`);
        try {
          const commonCards = await this.fetchRegularCards('Common', distribution.commons);
          if (commonCards.length > 0) {
            pack.push(...commonCards);
            commonCards.forEach(card => rarityMap.set(card.id, 'common'));
          }
        } catch (error) {
          console.error(`[AdventPackGenerator] Error fetching common cards:`, error);
        }
      }

      // 5. Validate pack has at least some cards
      if (pack.length === 0) {
        throw new Error('Failed to generate any cards for pack');
      }

      // 5. Shuffle the pack to mix custom and regular cards
      const shuffledPack = this.shuffleArray(pack);

      // 6. Convert to CardData format
      const cardDataPack = this.convertToCardData(shuffledPack, rarityMap);

      console.log(`[AdventPackGenerator] Successfully generated pack with ${cardDataPack.length} cards`);
      return cardDataPack;

    } catch (error) {
      console.error(`[AdventPackGenerator] Error generating pack for day ${day}:`, error);
      throw error;
    }
  }

  /**
   * Get a preview of what the pack will contain (without fetching cards)
   */
  static getPackPreview(day: number): PackDistribution {
    return this.getDayDistribution(day);
  }
}
