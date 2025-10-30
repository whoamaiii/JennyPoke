/**
 * Storage Migration Utility
 * Migrates data from sessionStorage to IndexedDB
 */

import { indexedDBManager, StoredCard } from './indexedDBManager';
import { logger } from './logger';
import { SessionCard, SessionCardState } from '@/types/pokemon';

const MIGRATION_KEY = 'storage_migration_completed';
const SESSION_STORAGE_KEY = 'pokemon_session_cards';

export interface MigrationResult {
  success: boolean;
  migratedCards: number;
  errors: number;
  alreadyMigrated: boolean;
}

/**
 * Check if migration has already been completed
 */
export async function isMigrationCompleted(): Promise<boolean> {
  try {
    const completed = await indexedDBManager.getMetadata(MIGRATION_KEY);
    return completed === true;
  } catch (error) {
    logger.error('StorageMigration', 'Failed to check migration status', error);
    return false;
  }
}

/**
 * Migrate data from sessionStorage to IndexedDB
 */
export async function migrateToIndexedDB(): Promise<MigrationResult> {
  logger.info('StorageMigration', 'Starting migration from sessionStorage to IndexedDB');

  try {
    // Check if already migrated
    const alreadyMigrated = await isMigrationCompleted();
    if (alreadyMigrated) {
      logger.info('StorageMigration', 'Migration already completed, skipping');
      return {
        success: true,
        migratedCards: 0,
        errors: 0,
        alreadyMigrated: true
      };
    }

    // Initialize IndexedDB
    await indexedDBManager.init();

    // Read data from sessionStorage
    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) {
      logger.info('StorageMigration', 'No session data found to migrate');
      await indexedDBManager.setMetadata(MIGRATION_KEY, true);
      return {
        success: true,
        migratedCards: 0,
        errors: 0,
        alreadyMigrated: false
      };
    }

    // Parse session data
    let sessionState: SessionCardState;
    try {
      sessionState = JSON.parse(sessionData);
    } catch (error) {
      logger.error('StorageMigration', 'Failed to parse session data', error);
      throw new Error('Invalid session data format');
    }

    if (!sessionState.cards || sessionState.cards.length === 0) {
      logger.info('StorageMigration', 'No cards found in session data');
      await indexedDBManager.setMetadata(MIGRATION_KEY, true);
      return {
        success: true,
        migratedCards: 0,
        errors: 0,
        alreadyMigrated: false
      };
    }

    // Convert SessionCard to StoredCard format
    const cardsToMigrate: StoredCard[] = sessionState.cards.map(card => ({
      ...card,
      timestamp: Date.now(),
      shown: sessionState.shownCardIds.includes(card.id)
    }));

    logger.info('StorageMigration', `Migrating ${cardsToMigrate.length} cards to IndexedDB`);

    // Add cards to IndexedDB in batches (more efficient)
    const BATCH_SIZE = 20;
    let migratedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < cardsToMigrate.length; i += BATCH_SIZE) {
      const batch = cardsToMigrate.slice(i, i + BATCH_SIZE);
      try {
        await indexedDBManager.addCards(batch);
        migratedCount += batch.length;
        logger.debug('StorageMigration', `Migrated batch ${i / BATCH_SIZE + 1}: ${batch.length} cards`);
      } catch (error) {
        logger.error('StorageMigration', `Failed to migrate batch ${i / BATCH_SIZE + 1}`, error);
        errorCount += batch.length;
      }
    }

    // Mark migration as completed
    await indexedDBManager.setMetadata(MIGRATION_KEY, true);
    await indexedDBManager.setMetadata('last_migration_date', new Date().toISOString());

    // Clear sessionStorage after successful migration (optional - keep for safety)
    // sessionStorage.removeItem(SESSION_STORAGE_KEY);

    logger.info('StorageMigration', `Migration completed: ${migratedCount} cards migrated, ${errorCount} errors`);

    return {
      success: errorCount === 0,
      migratedCards: migratedCount,
      errors: errorCount,
      alreadyMigrated: false
    };
  } catch (error) {
    logger.error('StorageMigration', 'Migration failed', error);
    return {
      success: false,
      migratedCards: 0,
      errors: 1,
      alreadyMigrated: false
    };
  }
}

/**
 * Clear sessionStorage after successful migration
 */
export function clearLegacyStorage(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    logger.info('StorageMigration', 'Cleared legacy sessionStorage');
  } catch (error) {
    logger.error('StorageMigration', 'Failed to clear legacy storage', error);
  }
}

/**
 * Reset migration status (for testing/debugging)
 */
export async function resetMigration(): Promise<void> {
  try {
    await indexedDBManager.setMetadata(MIGRATION_KEY, false);
    logger.info('StorageMigration', 'Migration status reset');
  } catch (error) {
    logger.error('StorageMigration', 'Failed to reset migration', error);
  }
}
