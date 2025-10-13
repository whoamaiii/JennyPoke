/**
 * Card Utilities
 * 
 * Utility functions for maintaining consistent Pokémon card aspect ratios
 * and dimensions across all components.
 */

// Standard Pokémon card aspect ratio is 2.5:3.5 (width:height)
export const CARD_ASPECT_RATIO = 2.5 / 3.5; // ≈ 0.714

/**
 * Calculate height based on width while maintaining aspect ratio
 */
export function calculateCardHeight(width: number): number {
  return Math.round(width / CARD_ASPECT_RATIO);
}

/**
 * Calculate width based on height while maintaining aspect ratio
 */
export function calculateCardWidth(height: number): number {
  return Math.round(height * CARD_ASPECT_RATIO);
}

/**
 * Get standardized card dimensions for different sizes
 */
export interface CardDimensions {
  width: number;
  height: number;
  className: string;
}

export function getCardDimensions(size: 'small' | 'grid' | 'large'): CardDimensions {
  switch (size) {
    case 'small':
      return {
        width: 128,
        height: calculateCardHeight(128),
        className: 'w-32 h-[179px] sm:w-48 sm:h-[269px]'
      };
    case 'grid':
      return {
        width: 245,
        height: calculateCardHeight(245),
        className: 'w-[245px] h-[343px]'
      };
    case 'large':
      return {
        width: 256,
        height: calculateCardHeight(256),
        className: 'w-64 h-[358px] sm:w-80 sm:h-[448px]'
      };
    default:
      return getCardDimensions('grid');
  }
}

/**
 * Ensure image maintains aspect ratio within container
 */
export function getImageContainerClasses(): string {
  return 'w-full h-full flex items-center justify-center bg-card card-container';
}

/**
 * Ensure image maintains aspect ratio
 */
export function getImageClasses(): string {
  return 'card-image';
}

/**
 * Check if container can fit card without distortion
 */
export function canFitCard(containerWidth: number, containerHeight: number, cardWidth: number, cardHeight: number): boolean {
  const scaleX = containerWidth / cardWidth;
  const scaleY = containerHeight / cardHeight;
  const scale = Math.min(scaleX, scaleY);
  return scale >= 1; // Can fit at full size or larger
}

/**
 * Calculate optimal scale for card within container
 */
export function calculateOptimalScale(containerWidth: number, containerHeight: number, cardWidth: number, cardHeight: number): number {
  const scaleX = containerWidth / cardWidth;
  const scaleY = containerHeight / cardHeight;
  return Math.min(scaleX, scaleY, 1); // Never scale up beyond original size
}
