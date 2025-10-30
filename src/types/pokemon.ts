// ============================================================================
// POKEMON TCG API TYPES
// ============================================================================

export interface PokemonTCGCard {
  id: string;
  name: string;
  set: {
    id?: string;
    name: string;
  };
  number: string;
  rarity: string;
  images: {
    small: string;
    large: string;
  };
  supertype?: string;
  hp?: string;
  types?: string[];
  attacks?: Array<{
    name: string;
    damage: string;
    cost?: string[];
    text?: string;
  }>;
  abilities?: Array<{
    name: string;
    text: string;
    type: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
}

export interface CardData {
  id: string;
  card: PokemonTCGCard;
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra-rare';
}

// ============================================================================
// CSV DATA TYPES
// ============================================================================

// Structure for a row in downloaded_sets.csv
// Columns: set_id,set_name,printed_total,last_updated,last_checked,cards_downloaded,set_complete
export interface SetCSVRow {
  set_id: string;
  set_name: string;
  printed_total: number;
  last_updated: string;
  last_checked: string;
  cards_downloaded: number;
  set_complete: boolean;
}

// Structure for a row in downloaded_cards.csv
// Columns: set_id,set_name,card_number,filename,download_date,image_url,is_hires,file_size,download_duration,status
export interface CardCSVRow {
  set_id: string;
  set_name: string;
  card_number: string;
  filename: string;
  download_date: string;
  image_url: string;
  is_hires: boolean;
  file_size: number;
  download_duration: number;
  status: string;
}

// ============================================================================
// SESSION STORAGE TYPES
// ============================================================================

// Structure for cards stored in session storage
// These cards include the downloaded image data for offline use
export interface SessionCard {
  id: string; // Unique identifier: `${set_id}-${card_number}`
  set_id: string;
  set_name: string;
  card_number: string;
  image_url: string;
  imageData: string; // Base64 encoded image data URL
  filename: string;
}

// Structure for tracking session state
export interface SessionCardState {
  cards: SessionCard[]; // All cards currently in session
  shownCardIds: string[]; // IDs of cards already shown to user
  isLoading: boolean;
  lastLoadTime: number;
}

// ============================================================================
// SETS CACHE JSON TYPES
// ============================================================================

// Structure for a set in sets_cache.json
export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Record<string, string>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images?: {
    symbol: string;
    logo: string;
  };
}

// ============================================================================
// ADVENT CALENDAR TYPES
// ============================================================================

// Custom card data for advent calendar
export interface CustomCardData {
  id: string; // e.g., "custom-001"
  baseCardId: string; // Pokemon TCG API card ID to use as base
  name: string;
  nickname?: string; // Optional custom nickname
  hp?: string;
  type?: string;
  rarity: string;
  customImage?: string; // Path to custom image if available
  attacks?: Array<{
    name: string;
    damage: string;
    description?: string;
    cost?: string[];
  }>;
  flavorText?: string;
  assignedDay: number; // Which day of advent (1-24)
  category: 'milestone' | 'inside-joke' | 'pet' | 'holiday' | 'location' | 'ultra-rare';
}

// Extended card data for custom cards
export interface CustomPokemonCard extends PokemonTCGCard {
  isCustom?: boolean;
  flavorText?: string;
  customData?: CustomCardData;
}

// Advent calendar progress tracking
export interface AdventProgress {
  year: number;
  openedDays: number[];
  lastOpened?: string; // ISO date string
}

// ============================================================================
// PACK SYSTEM TYPES
// ============================================================================

// Pack design types
export type PackDesign = 'standard' | 'premium' | 'ultra' | 'mystery';

// Animation speed types
export type AnimationSpeed = 'fast' | 'normal' | 'cinematic';

// Rarity weights for pack generation
export interface RarityWeights {
  common: number; // e.g., 0.60 (60% chance)
  uncommon: number; // e.g., 0.30 (30% chance)
  rare: number; // e.g., 0.08 (8% chance)
  'ultra-rare': number; // e.g., 0.02 (2% chance)
}

// Pack type definition
export interface PackType {
  id: string; // e.g., 'standard-booster', 'premium-collection'
  name: string; // Display name
  description: string; // Short description
  design: PackDesign; // Visual design to use
  cardCount: number; // Number of cards in pack
  rarityWeights: RarityWeights; // Probability distribution
  cost?: number; // Optional cost (for future economy system)
  setFilter?: string[]; // Optional: limit to specific sets
  guaranteedRare?: boolean; // Guarantee at least one rare card
}

// Pack metadata for display during opening
export interface PackMetadata {
  packType: PackType;
  set?: PokemonSet; // Set information if applicable
  openedAt: number; // Timestamp
  packId: string; // Unique identifier for this pack instance
}

// Pack opening history entry
export interface PackHistory {
  packId: string;
  packType: PackType;
  cards: CardData[];
  openedAt: number;
  favoriteCount: number;
  hasRare: boolean;
}

// Pack opening preferences
export interface PackPreferences {
  animationSpeed: AnimationSpeed;
  showFanPreview: boolean; // Show card fan preview before revealing
  showRareReveal: boolean; // Show special reveal for rare cards
  audioEnabled: boolean;
  audioVolume: number; // 0-1
}
