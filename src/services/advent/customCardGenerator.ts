import customCardsData from '@/data/custom-cards/customCardDatabase.json';
import { CustomCardData, CustomPokemonCard, PokemonTCGCard } from '@/types/pokemon';
import axios from 'axios';

const POKEMON_TCG_API_KEY = import.meta.env.VITE_POKEMON_TCG_API_KEY || '541aca44-b8f0-40f0-8149-4f0d9362eb72';

export class CustomCardGenerator {
  /**
   * Get all custom cards for a specific day
   */
  static getCardsForDay(day: number): CustomCardData[] {
    return customCardsData.cards.filter(card => card.assignedDay === day);
  }

  /**
   * Get all custom cards
   */
  static getAllCustomCards(): CustomCardData[] {
    return customCardsData.cards;
  }

  /**
   * Fetch base card from Pokemon TCG API
   */
  static async fetchBaseCard(cardId: string): Promise<PokemonTCGCard> {
    try {
      const response = await axios.get(
        `https://api.pokemontcg.io/v2/cards/${cardId}`,
        {
          headers: {
            'X-Api-Key': POKEMON_TCG_API_KEY
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching base card ${cardId}:`, error);
      throw new Error(`Failed to fetch base card: ${cardId}`);
    }
  }

  /**
   * Generate a custom Pokemon card by merging base card with custom data
   */
  static async generateCustomCard(
    customData: CustomCardData
  ): Promise<CustomPokemonCard> {
    // Fetch the base card from the API
    const baseCard = await this.fetchBaseCard(customData.baseCardId);

    // Create the custom card by merging base card with custom data
    const customCard: CustomPokemonCard = {
      ...baseCard,
      id: customData.id, // Use custom ID
      name: customData.name, // Override name
      hp: customData.hp || baseCard.hp,
      types: customData.type ? [customData.type] : baseCard.types,
      rarity: customData.rarity,
      isCustom: true,
      flavorText: customData.flavorText,
      customData: customData,
      // Override attacks if custom attacks are provided
      attacks: customData.attacks ? customData.attacks.map(attack => ({
        name: attack.name,
        damage: attack.damage,
        text: attack.description,
        cost: attack.cost
      })) : baseCard.attacks
    };

    // If there's a custom image, override the image URLs
    if (customData.customImage) {
      customCard.images = {
        small: `/custom-cards/${customData.customImage}`,
        large: `/custom-cards/${customData.customImage}`
      };
    }

    return customCard;
  }

  /**
   * Generate all custom cards for a specific day
   */
  static async generateCardsForDay(day: number): Promise<CustomPokemonCard[]> {
    const customCardData = this.getCardsForDay(day);
    const cards: CustomPokemonCard[] = [];

    for (const data of customCardData) {
      try {
        const card = await this.generateCustomCard(data);
        cards.push(card);
      } catch (error) {
        console.error(`Failed to generate custom card ${data.id}:`, error);
        // Continue with other cards even if one fails
      }
    }

    return cards;
  }

  /**
   * Check if a day has custom cards
   */
  static hasCustomCards(day: number): boolean {
    return this.getCardsForDay(day).length > 0;
  }

  /**
   * Get custom card count for a day
   */
  static getCustomCardCount(day: number): number {
    return this.getCardsForDay(day).length;
  }
}
