/**
 * Session Card Manager Service
 * 
 * Handles downloading and managing Pokémon card images in session storage.
 * Provides utilities for generating packs and tracking shown cards.
 */

import { CardCSVRow, SessionCard, SessionCardState } from '@/types/pokemon';
import { getRandomPendingCards } from './csvManager';
import { toast } from 'sonner';
import { downloadAndCompressImage, createImagePlaceholder } from '@/lib/imageUtils';

// Constants
const SESSION_STORAGE_KEY = 'pokemon_session_cards';
const CONCURRENT_DOWNLOADS = 4; // Number of concurrent image downloads (reduced for stability)
const CARDS_TO_LOAD = 32; // Maximum number of cards to keep in session storage
const REFRESH_THRESHOLD = 16; // Number of available cards before triggering a refresh
const PACK_SIZE = 8; // Number of cards in a pack
const MAX_RETRY_ATTEMPTS = 3; // Maximum retries for failed downloads
const DOWNLOAD_TIMEOUT = 10000; // 10 second timeout per download

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
    
    // If storage is full, aggressively reduce cards
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[SessionCardManager] Quota exceeded! Attempting to free space...');
      toast.error('Session storage full. Reducing card count...');
      
      try {
        // Strategy 1: Remove cards that have already been shown
        let reducedState = { ...state };
        reducedState.cards = state.cards.filter(card => !state.shownCardIds.includes(card.id));
        
        // If still have cards, try to save
        if (reducedState.cards.length > 0) {
          console.log(`[SessionCardManager] Removed shown cards, now have ${reducedState.cards.length} cards`);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(reducedState));
          return;
        }
        
        // Strategy 2: Keep only half the cards
        reducedState.cards = state.cards.slice(0, Math.floor(state.cards.length / 2));
        console.log(`[SessionCardManager] Keeping only ${reducedState.cards.length} cards`);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(reducedState));
      } catch (cleanupError) {
        console.error('[SessionCardManager] Failed to clean up session storage:', cleanupError);
        // Last resort: clear everything
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          console.log('[SessionCardManager] Cleared all session storage as last resort');
        } catch (e) {
          console.error('[SessionCardManager] Could not clear session storage:', e);
        }
      }
    }
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try to download image with multiple fallback strategies
 */
async function tryDownloadImage(imageUrl: string): Promise<Blob | null> {
  const strategies = [
    // Strategy 1: Try direct fetch (no proxy) - Pokemon TCG API may support CORS now
    { name: 'Direct', url: imageUrl },
    // Strategy 2: Try with corsproxy.io
    { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(imageUrl)}` },
    // Strategy 3: Try with allorigins.win
    { name: 'allorigins.win', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}` },
    // Strategy 4: Try standard resolution if hi-res fails
    { name: 'Standard res', url: imageUrl.replace('_hires', '') },
  ];
  
  for (const strategy of strategies) {
    try {
      console.log(`[SessionCardManager] Trying ${strategy.name}: ${strategy.url}`);
      
      const response = await fetchWithTimeout(strategy.url, {
        mode: 'cors',
        headers: {
          'Accept': 'image/png,image/jpeg,image/webp,image/*'
        }
      }, DOWNLOAD_TIMEOUT);
      
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          console.log(`[SessionCardManager] ✓ Success with ${strategy.name}, size: ${blob.size} bytes`);
          return blob;
        }
      }
      console.log(`[SessionCardManager] ✗ ${strategy.name} failed: ${response.status}`);
    } catch (error: any) {
      console.log(`[SessionCardManager] ✗ ${strategy.name} error: ${error.message}`);
    }
  }
  
  return null;
}

/**
 * Download a single card image and convert to data URL with retries
 */
async function downloadCardImage(card: CardCSVRow, retryCount = 0): Promise<SessionCard | null> {
  try {
    console.log(`[SessionCardManager] Downloading and compressing card image: ${card.set_id}-${card.card_number} from ${card.image_url}`);
    
    // Use the new image compression utility
    const compressedResult = await downloadAndCompressImage(card.image_url, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'webp'
    });
    
    console.log(`[SessionCardManager] ✓ Card ${card.set_id}-${card.card_number} compressed: ${compressedResult.originalSize} → ${compressedResult.compressedSize} bytes (${compressedResult.compressionRatio.toFixed(1)}% reduction)`);
    
    return {
      id: `${card.set_id}-${card.card_number}`,
      set_id: card.set_id,
      set_name: card.set_name,
      card_number: card.card_number,
      image_url: card.image_url,
      imageData: compressedResult.dataUrl,
      filename: card.filename
    };
  } catch (error) {
    console.error(`[SessionCardManager] Error downloading card ${card.set_id}-${card.card_number}:`, error);
    
    // Retry with exponential backoff if we haven't exceeded max retries
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`[SessionCardManager] Retry ${retryCount + 1}/${MAX_RETRY_ATTEMPTS} after error, waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return downloadCardImage(card, retryCount + 1);
    }
    
    // If all retries failed, create a placeholder
    console.warn(`[SessionCardManager] Creating placeholder for failed card ${card.set_id}-${card.card_number}`);
    const placeholder = createImagePlaceholder(400, 600);
    
    return {
      id: `${card.set_id}-${card.card_number}`,
      set_id: card.set_id,
      set_name: card.set_name,
      card_number: card.card_number,
      image_url: card.image_url,
      imageData: placeholder,
      filename: card.filename
    };
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
    console.log('[SessionCardManager] Already downloading cards, skipping duplicate request');
    toast.info('Already downloading cards. Please wait...');
    return false;
  }
  
  console.log('[SessionCardManager] Starting card download process');
  
  try {
    isDownloading = true;
    const sessionState = getSessionState();
    sessionState.isLoading = true;
    saveSessionState(sessionState);
    
    // Calculate how many cards we can download to stay within limit
    const currentCardCount = sessionState.cards.length;
    const availableSlots = Math.max(0, CARDS_TO_LOAD - currentCardCount);
    
    console.log(`[SessionCardManager] Current cards: ${currentCardCount}, Max: ${CARDS_TO_LOAD}, Available slots: ${availableSlots}`);
    
    if (availableSlots === 0) {
      console.log('[SessionCardManager] Already at maximum card capacity');
      sessionState.isLoading = false;
      saveSessionState(sessionState);
      return true;
    }
    
    // Download up to the available slots (max 32 total)
    const cardsToDownload = Math.min(availableSlots, CARDS_TO_LOAD);
    console.log(`[SessionCardManager] Requesting ${cardsToDownload} random cards from CSV...`);
    const randomCards = await getRandomPendingCards(cardsToDownload);
    
    console.log(`[SessionCardManager] Found ${randomCards.length} cards to download`);
    if (randomCards.length > 0) {
      console.log('[SessionCardManager] First 3 cards to download:', randomCards.slice(0, 3).map(c => ({
        id: `${c.set_id}-${c.card_number}`,
        set: c.set_name,
        url: c.image_url
      })));
    }
    
    if (randomCards.length === 0) {
      console.error('[SessionCardManager] No cards available for download');
      toast.error('No cards available for download. Check if CSV files are correctly loaded.');
      sessionState.isLoading = false;
      saveSessionState(sessionState);
      return false;
    }
    
    toast.info(`Downloading ${randomCards.length} cards for offline play...`);
    
    // Download images
    const newSessionCards = await downloadCardBatch(randomCards);
    console.log(`[SessionCardManager] Successfully downloaded ${newSessionCards.length} out of ${randomCards.length} attempted`);
    
    if (newSessionCards.length === 0) {
      console.error('[SessionCardManager] Failed to download any cards');
      toast.error('Failed to download any cards. Check network connection and try again.');
      sessionState.isLoading = false;
      saveSessionState(sessionState);
      return false;
    }
    
    // Update session storage immediately with what we have, enforcing the limit
    const updatedState = getSessionState();
    const combinedCards = [...newSessionCards, ...updatedState.cards];
    // Enforce the maximum limit
    updatedState.cards = combinedCards.slice(0, CARDS_TO_LOAD);
    updatedState.isLoading = false;
    updatedState.lastLoadTime = Date.now();
    
    console.log(`[SessionCardManager] Saving ${updatedState.cards.length} cards to session storage...`);
    saveSessionState(updatedState);
    
    // Verify save was successful
    const verifyState = getSessionState();
    console.log(`[SessionCardManager] ✓ Verified: ${verifyState.cards.length} cards now in session storage`);
    
    // Set flag based on successful download
    isInitialized = true;
    
    // Show success message
    console.log(`[SessionCardManager] Successfully downloaded and saved ${newSessionCards.length} cards`);
    toast.success(`Downloaded ${newSessionCards.length} cards successfully!`);
    
    return true;
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
 * Download more cards in the background without blocking UI
 * This function is now disabled to respect the 32 card limit
 */
async function downloadMoreCardsInBackground(): Promise<boolean> {
  if (isDownloading) {
    console.log('[SessionCardManager] Already downloading cards, background request skipped');
    return false;
  }
  
  console.log('[SessionCardManager] Background download disabled - using 32 card limit');
  
  // Background downloads are disabled to prevent exceeding the 32 card limit
  // The initial download of 32 cards should be sufficient for the pack opening experience
  return false;
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
  
  console.log(`[SessionCardManager] Getting random pack from ${sessionState.cards.length} total cards`);
  console.log(`[SessionCardManager] ${sessionState.shownCardIds.length} cards already shown`);
  
  // Check if we have any cards at all first
  if (sessionState.cards.length === 0) {
    console.log('[SessionCardManager] No cards in session yet!');
    // Trigger a download if not already happening
    if (!isDownloading && !sessionState.isLoading) {
      refreshSessionCards();
    }
    return { cards: [], needsRefresh: true };
  }
  
  // Filter to cards that haven't been shown yet
  const availableCards = sessionState.cards.filter(card => !sessionState.shownCardIds.includes(card.id));
  console.log(`[SessionCardManager] ${availableCards.length} available cards after filtering shown cards`);
  
  // If we've shown all cards, just use any cards (temporary solution)
  const cardsToUse = availableCards.length > 0 ? availableCards : sessionState.cards;
  
  // Check if we need a refresh based on threshold
  const needsRefresh = availableCards.length <= REFRESH_THRESHOLD;
  
  // Randomize available cards
  const shuffledCards = [...cardsToUse].sort(() => Math.random() - 0.5);
  
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
  
  console.log(`[SessionCardManager] Returning ${packCards.length} cards for pack`);
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
  console.log(`[SessionCardManager] Converting ${sessionCards.length} session cards to CardData format`);
  
  return sessionCards.map(sessionCard => {
    // Ensure we have valid image data
    if (!sessionCard.imageData) {
      console.warn(`[SessionCardManager] Card ${sessionCard.id} has no imageData!`);
    }
    
    // Create a card name based on set and number
    const cardName = `${sessionCard.set_name} #${sessionCard.card_number}`;
    
    // Create a basic card object that matches the expected format
    return {
      id: sessionCard.id,
      card: {
        id: sessionCard.id,
        name: cardName,
        set: {
          id: sessionCard.set_id,
          name: sessionCard.set_name
        },
        number: sessionCard.card_number,
        rarity: "Unknown",  // Placeholder until API call
        images: {
          small: sessionCard.imageData || sessionCard.image_url,
          large: sessionCard.imageData || sessionCard.image_url
        },
        // Placeholder data - will be filled in by API call when user views card
        supertype: "Pokémon",
        hp: "??",
        types: [],
        attacks: []
      },
      rarity: 'common',  // Default rarity until API call
      
      // Add special properties for session cards
      isSessionCard: true,
      imageData: sessionCard.imageData,
      image_url: sessionCard.image_url
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
