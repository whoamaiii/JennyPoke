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
