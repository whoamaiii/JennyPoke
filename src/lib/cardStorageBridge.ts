/**
 * Card Storage Bridge
 *
 * Provides a dual-layer storage system:
 * - sessionStorage for fast sync access (cache layer)
 * - IndexedDB for reliable persistent storage (persistence layer)
 *
 * This allows existing sync code to continue working while benefiting
 * from IndexedDB's larger capacity and reliability.
 */

import { SessionCard } from '@/types/pokemon';
import { indexedDBManager, StoredCard } from './indexedDBManager';
import { logger } from './logger';

const SESSION_KEY = 'pokemon_session_cards_v2';

/**
 * Load cards from IndexedDB into sessionStorage cache
 * Call this on app startup
 */
export async function warmupCache(): Promise<number> {
  try {
    logger.info('CardStorageBridge', 'Warming up cache from IndexedDB');

    // Get all cards from IndexedDB
    const storedCards = await indexedDBManager.getAllCards();

    // Convert to SessionCard format
    const sessionCards: SessionCard[] = storedCards.map(card => ({
      id: card.id,
      set_id: card.set_id,
      set_name: card.set_name,
      card_number: card.card_number,
      image_url: card.image_url,
      imageData: card.imageData,
      filename: card.filename
    }));

    // Store in sessionStorage
    if (sessionCards.length > 0) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionCards));
        logger.info('CardStorageBridge', `Cached ${sessionCards.length} cards in sessionStorage`);
      } catch (error) {
        logger.warn('CardStorageBridge', 'Session storage full, using IndexedDB only', error);
      }
    }

    return sessionCards.length;
  } catch (error) {
    logger.error('CardStorageBridge', 'Failed to warmup cache', error);
    return 0;
  }
}

/**
 * Get all cards (from cache or IndexedDB)
 */
export function getCards(): SessionCard[] {
  try {
    // Try cache first
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('CardStorageBridge', 'Cache read failed', error);
  }

  return [];
}

/**
 * Get cards that haven't been shown
 */
export function getUnshownCards(): SessionCard[] {
  const allCards = getCards();
  const shown = getShownCardIds();
  return allCards.filter(card => !shown.includes(card.id));
}

/**
 * Add cards to storage (both cache and IndexedDB)
 */
export async function addCards(cards: SessionCard[]): Promise<boolean> {
  try {
    // Add to IndexedDB (persistent)
    const storedCards: StoredCard[] = cards.map(card => ({
      ...card,
      timestamp: Date.now(),
      shown: false
    }));

    await indexedDBManager.addCards(storedCards);
    logger.info('CardStorageBridge', `Added ${cards.length} cards to IndexedDB`);

    // Update cache
    const current = getCards();
    const updated = [...cards, ...current];

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      logger.debug('CardStorageBridge', 'Cache updated');
    } catch (error) {
      logger.warn('CardStorageBridge', 'Cache update failed, IndexedDB still has data', error);
    }

    return true;
  } catch (error) {
    logger.error('CardStorageBridge', 'Failed to add cards', error);
    return false;
  }
}

/**
 * Mark cards as shown
 */
export async function markCardsAsShown(cardIds: string[]): Promise<boolean> {
  try {
    // Update IndexedDB
    await indexedDBManager.markCardsAsShown(cardIds);
    logger.debug('CardStorageBridge', `Marked ${cardIds.length} cards as shown`);

    // Update metadata cache
    const currentShown = getShownCardIds();
    const updated = [...new Set([...currentShown, ...cardIds])];
    try {
      sessionStorage.setItem(`${SESSION_KEY}_shown`, JSON.stringify(updated));
    } catch (error) {
      logger.warn('CardStorageBridge', 'Cache update failed for shown cards', error);
    }

    return true;
  } catch (error) {
    logger.error('CardStorageBridge', 'Failed to mark cards as shown', error);
    return false;
  }
}

/**
 * Get shown card IDs
 */
export function getShownCardIds(): string[] {
  try {
    const cached = sessionStorage.getItem(`${SESSION_KEY}_shown`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('CardStorageBridge', 'Failed to get shown card IDs', error);
  }

  return [];
}

/**
 * Delete cards from storage
 */
export async function deleteCards(cardIds: string[]): Promise<boolean> {
  try {
    // Delete from IndexedDB
    await indexedDBManager.deleteCards(cardIds);
    logger.debug('CardStorageBridge', `Deleted ${cardIds.length} cards`);

    // Update cache
    const current = getCards();
    const updated = current.filter(card => !cardIds.includes(card.id));

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.warn('CardStorageBridge', 'Cache update failed', error);
    }

    return true;
  } catch (error) {
    logger.error('CardStorageBridge', 'Failed to delete cards', error);
    return false;
  }
}

/**
 * Get card count
 */
export async function getCardCount(): Promise<number> {
  try {
    return await indexedDBManager.getCardCount();
  } catch (error) {
    logger.error('CardStorageBridge', 'Failed to get card count', error);
    // Fallback to cache
    return getCards().length;
  }
}

/**
 * Get unshown card count
 */
export async function getUnshownCardCount(): Promise<number> {
  try {
    return await indexedDBManager.getUnshownCardCount();
  } catch (error) {
    logger.error('CardStorageBridge', 'Failed to get unshown count', error);
    // Fallback to cache
    return getUnshownCards().length;
  }
}

/**
 * Clear all cards
 */
export async function clearAllCards(): Promise<boolean> {
  try {
    await indexedDBManager.clearAllCards();
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(`${SESSION_KEY}_shown`);
    logger.info('CardStorageBridge', 'Cleared all cards');
    return true;
  } catch (error) {
    logger.error('CardStorageBridge', 'Failed to clear cards', error);
    return false;
  }
}

/**
 * Get storage stats
 */
export async function getStorageStats(): Promise<{
  totalCards: number;
  unshownCards: number;
  shownCards: number;
}> {
  const totalCards = await getCardCount();
  const unshownCards = await getUnshownCardCount();

  return {
    totalCards,
    unshownCards,
    shownCards: totalCards - unshownCards
  };
}
