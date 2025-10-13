/**
 * Session Card Manager Service
 * 
 * Handles downloading and managing Pokémon card images in session storage.
 * Provides utilities for generating packs and tracking shown cards.
 */

import { CardCSVRow, SessionCard, SessionCardState } from '@/types/pokemon';
import { getRandomPendingCards } from './csvManager';
import { toast } from 'sonner';

// Constants
const SESSION_STORAGE_KEY = 'pokemon_session_cards';
const CONCURRENT_DOWNLOADS = 8; // Number of concurrent image downloads
const CARDS_TO_LOAD = 100; // Number of cards to load into session
const REFRESH_THRESHOLD = 50; // Number of shown cards before triggering a refresh
const PACK_SIZE = 8; // Number of cards in a pack

// State management
let isInitialized = false;
let isDownloading = false;

/**
 * Initialize session card manager
 * Called on website load
 */
export async function initializeSessionCards(): Promise<boolean> {
  if (isInitialized || isDownloading) return false;
  
  try {
    // Check if we already have cards in session
    const sessionState = getSessionState();
    if (sessionState.cards.length > 0) {
      console.log(`Using ${sessionState.cards.length} cards already in session`);
      isInitialized = true;
      return true;
    }
    
    // Start downloading cards
    return await refreshSessionCards();
  } catch (error) {
    console.error('Error initializing session cards:', error);
    toast.error('Failed to initialize card data.');
    return false;
  }
}

/**
 * Get current session state
 */
export function getSessionState(): SessionCardState {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SessionCardState;
    }
  } catch (error) {
    console.error('Error reading session storage:', error);
  }
  
  // Return default state if nothing in session or error
  return {
    cards: [],
    shownCardIds: [],
    isLoading: false,
    lastLoadTime: 0
  };
}

/**
 * Save session state
 */
function saveSessionState(state: SessionCardState): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving to session storage:', error);
    
    // If storage is full, try to remove image data from older cards
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toast.error('Session storage is full. Some cards may not be available offline.');
      
      try {
        const currentState = getSessionState();
        // Keep shown cards but remove their image data to free up space
        currentState.cards.forEach(card => {
          if (currentState.shownCardIds.includes(card.id)) {
            card.imageData = ''; // Remove image data
          }
        });
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentState));
      } catch (cleanupError) {
        console.error('Failed to clean up session storage:', cleanupError);
      }
    }
  }
}

/**
 * Download a single card image and convert to data URL
 */
async function downloadCardImage(card: CardCSVRow): Promise<SessionCard | null> {
  try {
    const response = await fetch(card.image_url);
    if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          id: `${card.set_id}-${card.card_number}`,
          set_id: card.set_id,
          set_name: card.set_name,
          card_number: card.card_number,
          image_url: card.image_url,
          imageData: reader.result as string,
          filename: card.filename
        });
      };
      reader.onerror = () => {
        console.error(`Error reading image data for ${card.set_id}-${card.card_number}`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error downloading card ${card.set_id}-${card.card_number}:`, error);
    return null;
  }
}

/**
 * Download multiple card images in parallel
 */
async function downloadCardBatch(cards: CardCSVRow[]): Promise<SessionCard[]> {
  // Split cards into smaller batches for parallel processing
  const batchSize = CONCURRENT_DOWNLOADS;
  const batches: CardCSVRow[][] = [];
  
  for (let i = 0; i < cards.length; i += batchSize) {
    batches.push(cards.slice(i, i + batchSize));
  }
  
  const sessionCards: SessionCard[] = [];
  let completedCount = 0;
  const totalCards = cards.length;
  
  // Process each batch sequentially but download cards in a batch in parallel
  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(card => downloadCardImage(card)));
    
    // Filter out nulls (failed downloads)
    const successfulCards = batchResults.filter(card => card !== null) as SessionCard[];
    sessionCards.push(...successfulCards);
    
    // Update progress
    completedCount += batch.length;
    const percentComplete = Math.round((completedCount / totalCards) * 100);
    console.log(`Downloaded ${completedCount}/${totalCards} cards (${percentComplete}%)`);
    
    // Report progress if more than 25% of cards loaded
    if (sessionCards.length >= totalCards * 0.25 && sessionCards.length % 10 === 0) {
      toast.info(`Downloaded ${sessionCards.length} card images for offline play.`);
    }
  }
  
  return sessionCards;
}

/**
 * Download a new batch of cards and add to session
 */
export async function refreshSessionCards(): Promise<boolean> {
  if (isDownloading) {
    toast.info('Already downloading cards. Please wait...');
    return false;
  }
  
  try {
    isDownloading = true;
    const sessionState = getSessionState();
    sessionState.isLoading = true;
    saveSessionState(sessionState);
    
    // Get random cards to download
    const randomCards = await getRandomPendingCards(CARDS_TO_LOAD);
    if (randomCards.length === 0) {
      toast.error('No cards available for download.');
      return false;
    }
    
    toast.info(`Downloading ${Math.min(randomCards.length, CARDS_TO_LOAD)} cards for offline play...`);
    
    // Download images in parallel
    const newSessionCards = await downloadCardBatch(randomCards.slice(0, CARDS_TO_LOAD));
    
    // Update session storage
    const updatedState = getSessionState();
    updatedState.cards = [...newSessionCards, ...updatedState.cards];
    updatedState.isLoading = false;
    updatedState.lastLoadTime = Date.now();
    saveSessionState(updatedState);
    
    // Set flag based on successful download of at least some cards
    isInitialized = newSessionCards.length > 0;
    
    // Show success message
    if (newSessionCards.length > 0) {
      toast.success(`Downloaded ${newSessionCards.length} cards successfully!`);
      return true;
    } else {
      toast.error('Failed to download any cards.');
      return false;
    }
  } catch (error) {
    console.error('Error refreshing session cards:', error);
    toast.error('Failed to download cards.');
    return false;
  } finally {
    isDownloading = false;
    
    // Make sure to update loading state even if there was an error
    const finalState = getSessionState();
    if (finalState.isLoading) {
      finalState.isLoading = false;
      saveSessionState(finalState);
    }
  }
}

/**
 * Check if we need to refresh cards based on shown count
 */
export function checkNeedRefresh(): boolean {
  const sessionState = getSessionState();
  const availableCount = sessionState.cards.length - sessionState.shownCardIds.length;
  
  // Need refresh if fewer than threshold cards are available and not already downloading
  return availableCount < REFRESH_THRESHOLD && !sessionState.isLoading && !isDownloading;
}

/**
 * Get a random pack of cards from session
 */
export function getRandomPack(): { cards: SessionCard[], needsRefresh: boolean } {
  const sessionState = getSessionState();
  const availableCards = sessionState.cards.filter(card => !sessionState.shownCardIds.includes(card.id));
  
  // Check if we need a refresh based on threshold
  const needsRefresh = availableCards.length <= REFRESH_THRESHOLD;
  
  // Randomize available cards
  const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5);
  
  // Take at most PACK_SIZE cards
  const packCards = shuffledCards.slice(0, PACK_SIZE);
  
  // If we don't have enough cards, show what we have
  if (packCards.length < PACK_SIZE) {
    toast.warning(`Only ${packCards.length} cards available. Downloading more in background...`);
    
    // Trigger a refresh in background if not already happening
    if (!isDownloading && !sessionState.isLoading) {
      refreshSessionCards();
    }
  }
  
  return { cards: packCards, needsRefresh };
}

/**
 * Mark cards as shown and update session state
 */
export function markCardsAsShown(cardIds: string[]): void {
  const sessionState = getSessionState();
  
  // Add new IDs to shown list without duplicates
  const newShownIds = [...new Set([...sessionState.shownCardIds, ...cardIds])];
  
  // Update session state
  sessionState.shownCardIds = newShownIds;
  saveSessionState(sessionState);
  
  // Check if we need to refresh
  if (checkNeedRefresh() && !isDownloading) {
    toast.info('Downloading more cards in background...');
    refreshSessionCards();
  }
}

/**
 * Convert session cards to format needed by pack opener
 */
export function convertSessionCardToCardData(sessionCards: SessionCard[]): any[] {
  return sessionCards.map(sessionCard => {
    // Create a basic card object that matches the expected format
    return {
      id: sessionCard.id,
      card: {
        id: sessionCard.id,
        name: `Card ${sessionCard.card_number}`,  // Placeholder until API call
        set: {
          id: sessionCard.set_id,
          name: sessionCard.set_name
        },
        number: sessionCard.card_number,
        rarity: "Unknown",  // Placeholder until API call
        images: {
          small: sessionCard.image_url,
          large: sessionCard.image_url
        },
        // Placeholder data - will be filled in by API call when user views card
        supertype: "Pokémon",
        hp: "??",
        types: [],
        attacks: []
      },
      rarity: 'common',  // Default rarity until API call
      // Add a special flag to indicate this is a session card
      isSessionCard: true,
      imageData: sessionCard.imageData
    };
  });
}

/**
 * Get statistics about session storage
 */
export function getSessionStats() {
  const state = getSessionState();
  return {
    totalCards: state.cards.length,
    shownCards: state.shownCardIds.length,
    availableCards: state.cards.length - state.shownCardIds.length,
    isLoading: state.isLoading || isDownloading,
    lastLoadTime: state.lastLoadTime
  };
}
