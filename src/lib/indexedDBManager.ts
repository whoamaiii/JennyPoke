/**
 * IndexedDB Manager for storing Pokemon card images
 * Replaces sessionStorage for better performance and larger capacity
 *
 * IndexedDB Benefits:
 * - 50MB-1GB+ storage (vs 5-10MB for sessionStorage)
 * - Async operations (non-blocking)
 * - Better performance for large data
 * - Structured data storage
 */

import { logger } from './logger';

const DB_NAME = 'PokemonPacksDB';
const DB_VERSION = 1;
const STORE_NAME = 'cardImages';
const METADATA_STORE = 'metadata';

export interface StoredCard {
  id: string;
  set_id: string;
  set_name: string;
  card_number: string;
  image_url: string;
  imageData: string; // Base64 compressed image
  filename: string;
  timestamp: number; // When it was stored
  shown: boolean; // Whether card has been shown to user
}

export interface DBMetadata {
  key: string;
  value: any;
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.db) return; // Already initialized

    if (this.dbPromise) {
      await this.dbPromise; // Wait for pending initialization
      return;
    }

    this.dbPromise = this.openDatabase();
    this.db = await this.dbPromise;
    this.dbPromise = null;

    logger.info('IndexedDBManager', 'Database initialized successfully');
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to open database', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('shown', 'shown', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('set_id', 'set_id', { unique: false });
          logger.info('IndexedDBManager', 'Created cardImages object store');
        }

        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
          logger.info('IndexedDBManager', 'Created metadata object store');
        }
      };
    });
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  /**
   * Add a single card to the database
   */
  async addCard(card: StoredCard): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ ...card, timestamp: Date.now(), shown: false });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('IndexedDBManager', `Failed to add card ${card.id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add multiple cards in a single transaction (more efficient)
   */
  async addCards(cards: StoredCard[]): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        logger.info('IndexedDBManager', `Successfully added ${cards.length} cards`);
        resolve();
      };

      transaction.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to add cards batch', transaction.error);
        reject(transaction.error);
      };

      cards.forEach(card => {
        store.put({ ...card, timestamp: Date.now(), shown: card.shown || false });
      });
    });
  }

  /**
   * Get a card by ID
   */
  async getCard(id: string): Promise<StoredCard | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        logger.error('IndexedDBManager', `Failed to get card ${id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all cards
   */
  async getAllCards(): Promise<StoredCard[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to get all cards', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cards that haven't been shown yet
   */
  async getUnshownCards(limit?: number): Promise<StoredCard[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('shown');
      const request = index.getAll(false, limit);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to get unshown cards', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark cards as shown
   */
  async markCardsAsShown(cardIds: string[]): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        logger.debug('IndexedDBManager', `Marked ${cardIds.length} cards as shown`);
        resolve();
      };

      transaction.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to mark cards as shown', transaction.error);
        reject(transaction.error);
      };

      cardIds.forEach(id => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const card = getRequest.result;
          if (card) {
            card.shown = true;
            store.put(card);
          }
        };
      });
    });
  }

  /**
   * Delete specific cards
   */
  async deleteCards(cardIds: string[]): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        logger.debug('IndexedDBManager', `Deleted ${cardIds.length} cards`);
        resolve();
      };

      transaction.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to delete cards', transaction.error);
        reject(transaction.error);
      };

      cardIds.forEach(id => {
        store.delete(id);
      });
    });
  }

  /**
   * Get total count of cards
   */
  async getCardCount(): Promise<number> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to count cards', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get count of unshown cards
   */
  async getUnshownCardCount(): Promise<number> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('shown');
      const request = index.count(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to count unshown cards', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all cards from database
   */
  async clearAllCards(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        logger.info('IndexedDBManager', 'Cleared all cards');
        resolve();
      };
      request.onerror = () => {
        logger.error('IndexedDBManager', 'Failed to clear cards', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        logger.error('IndexedDBManager', `Failed to set metadata ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => {
        logger.error('IndexedDBManager', `Failed to get metadata ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if IndexedDB is supported and available
   */
  static isSupported(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Estimate storage quota
   */
  async estimateStorage(): Promise<{ usage: number; quota: number; available: number } | null> {
    if (!navigator.storage || !navigator.storage.estimate) {
      logger.warn('IndexedDBManager', 'Storage estimation not supported');
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const available = quota - usage;

      logger.debug('IndexedDBManager', `Storage: ${(usage / 1024 / 1024).toFixed(2)}MB used / ${(quota / 1024 / 1024).toFixed(2)}MB total`);

      return { usage, quota, available };
    } catch (error) {
      logger.error('IndexedDBManager', 'Failed to estimate storage', error);
      return null;
    }
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();
