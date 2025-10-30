/**
 * Universal Storage Manager
 * Provides fallback storage mechanisms for better browser/device compatibility
 * Priority: sessionStorage -> localStorage -> in-memory storage
 */

type StorageType = 'session' | 'local' | 'memory';

class UniversalStorage {
  private activeStorage: StorageType = 'memory';
  private memoryStore: Map<string, string> = new Map();
  private initialized = false;

  constructor() {
    this.detectBestStorage();
  }

  /**
   * Detect the best available storage mechanism
   */
  private detectBestStorage(): void {
    if (typeof window === 'undefined') {
      this.activeStorage = 'memory';
      this.initialized = true;
      return;
    }
    // Try sessionStorage first
    if (this.testStorage('sessionStorage')) {
      this.activeStorage = 'session';
      this.initialized = true;
      console.log('[Storage] Using sessionStorage');
      return;
    }

    // Fallback to localStorage
    if (this.testStorage('localStorage')) {
      this.activeStorage = 'local';
      this.initialized = true;
      console.log('[Storage] Fallback to localStorage');
      return;
    }

    // Final fallback to memory
    this.activeStorage = 'memory';
    this.initialized = true;
    console.warn('[Storage] Using in-memory storage (data will not persist)');
  }

  /**
   * Test if a storage mechanism is available and working
   */
  private testStorage(type: 'sessionStorage' | 'localStorage'): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get the current storage backend
   */
  getStorageType(): StorageType {
    return this.activeStorage;
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Get item from storage
   */
  getItem(key: string): string | null {
    try {
      switch (this.activeStorage) {
        case 'session':
          return typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null;
        case 'local':
          return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        case 'memory':
          return this.memoryStore.get(key) || null;
        default:
          return null;
      }
    } catch (error) {
      console.error('[Storage] Error getting item:', error);
      // Try memory fallback
      return this.memoryStore.get(key) || null;
    }
  }

  /**
   * Set item in storage
   */
  setItem(key: string, value: string): boolean {
    try {
      switch (this.activeStorage) {
        case 'session':
          if (typeof window === 'undefined') return false;
          window.sessionStorage.setItem(key, value);
          return true;
        case 'local':
          if (typeof window === 'undefined') return false;
          window.localStorage.setItem(key, value);
          return true;
        case 'memory':
          this.memoryStore.set(key, value);
          return true;
        default:
          return false;
      }
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn('[Storage] Quota exceeded, attempting cleanup');
        
        // Try to free up space and retry
        if (this.activeStorage !== 'memory') {
          this.clearOldestItems(key);
          try {
            if (typeof window !== 'undefined') {
              if (this.activeStorage === 'session') {
                window.sessionStorage.setItem(key, value);
              } else {
                window.localStorage.setItem(key, value);
              }
              return true;
            }
          } catch (retryError) {
            console.error('[Storage] Retry failed, falling back to memory');
            this.activeStorage = 'memory';
            this.memoryStore.set(key, value);
            return true;
          }
        }
      }
      
      console.error('[Storage] Error setting item:', error);
      // Final fallback to memory
      this.memoryStore.set(key, value);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    try {
      switch (this.activeStorage) {
        case 'session':
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(key);
          }
          break;
        case 'local':
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
          break;
        case 'memory':
          this.memoryStore.delete(key);
          break;
      }
    } catch (error) {
      console.error('[Storage] Error removing item:', error);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      switch (this.activeStorage) {
        case 'session':
          if (typeof window !== 'undefined') {
            window.sessionStorage.clear();
          }
          break;
        case 'local':
          if (typeof window !== 'undefined') {
            window.localStorage.clear();
          }
          break;
        case 'memory':
          this.memoryStore.clear();
          break;
      }
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
    }
  }

  /**
   * Get all keys in storage
   */
  getAllKeys(): string[] {
    try {
      switch (this.activeStorage) {
        case 'session':
          return typeof window !== 'undefined' ? Object.keys(window.sessionStorage) : [];
        case 'local':
          return typeof window !== 'undefined' ? Object.keys(window.localStorage) : [];
        case 'memory':
          return Array.from(this.memoryStore.keys());
        default:
          return [];
      }
    } catch (error) {
      console.error('[Storage] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Clear oldest items to free up space (except the current key being set)
   */
  private clearOldestItems(protectedKey: string): void {
    try {
      const keys = this.getAllKeys().filter(k => k !== protectedKey);
      
      // Remove half of the items to free up space
      const itemsToRemove = Math.ceil(keys.length / 2);
      for (let i = 0; i < itemsToRemove && i < keys.length; i++) {
        this.removeItem(keys[i]);
      }
      
      console.log(`[Storage] Cleared ${itemsToRemove} items to free up space`);
    } catch (error) {
      console.error('[Storage] Error clearing oldest items:', error);
    }
  }

  /**
   * Estimate available storage space (in bytes)
   */
  async estimateSpace(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (error) {
        console.error('[Storage] Error estimating space:', error);
      }
    }
    return null;
  }
}

// Export singleton instance
export const universalStorage = new UniversalStorage();

// Helper function to check if storage is critically low
export async function isStorageCriticallyLow(): Promise<boolean> {
  const estimate = await universalStorage.estimateSpace();
  if (!estimate) return false;
  
  const usagePercent = (estimate.usage / estimate.quota) * 100;
  return usagePercent > 90; // Consider critical if over 90% full
}
