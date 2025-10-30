# IndexedDB Integration Guide

## Status: ✅ Infrastructure Complete, Integration In Progress

The IndexedDB system is now ready to use! This guide explains what's been implemented and how to complete the integration.

---

## ✅ What's Been Implemented

### 1. Core Infrastructure (Complete)

#### IndexedDB Manager ([src/lib/indexedDBManager.ts](src/lib/indexedDBManager.ts))
- Full IndexedDB wrapper with clean API
- Card storage with indexes for fast queries
- Metadata storage for app state
- Storage quota estimation
- Error handling and fallbacks

**Key Methods:**
```typescript
// Initialize (call once on app startup)
await indexedDBManager.init();

// Add cards
await indexedDBManager.addCards(cards);

// Get unshown cards
const cards = await indexedDBManager.getUnshownCards(8);

// Mark as shown
await indexedDBManager.markCardsAsShown(['id1', 'id2']);

// Get counts
const total = await indexedDBManager.getCardCount();
const unshown = await indexedDBManager.getUnshownCardCount();
```

#### Storage Bridge ([src/lib/cardStorageBridge.ts](src/lib/cardStorageBridge.ts))
- Dual-layer storage (sessionStorage + IndexedDB)
- Maintains sync API for existing code
- Automatic cache warmup from IndexedDB
- Background persistence to IndexedDB

**Key Methods:**
```typescript
// Initialize cache from IndexedDB (call on app start)
await warmupCache();

// Use sync methods (backed by IndexedDB)
const cards = getCards();
const unshown = getUnshownCards();

// Add cards (syncs to both layers)
await addCards(newCards);

// Mark as shown
await markCardsAsShown(['id1', 'id2']);
```

#### Migration Utility ([src/lib/storageMigration.ts](src/lib/storageMigration.ts))
- Automatic migration from old sessionStorage to IndexedDB
- One-time migration with status tracking
- Error handling and progress reporting

**Usage:**
```typescript
// Check if migration needed
const migrated = await isMigrationCompleted();

// Run migration
const result = await migrateToIndexedDB();
console.log(`Migrated ${result.migratedCards} cards`);
```

### 2. App Initialization (Complete)

**[src/App.tsx](src/App.tsx)** now:
1. Initializes IndexedDB on startup
2. Runs migration if needed
3. Warms up sessionStorage cache
4. Reports storage quota

---

## 🔄 Integration Steps (What Needs To Be Done)

### Option A: Gradual Migration (Recommended)

Keep existing code working while gradually moving to the new system.

#### Step 1: Update sessionCardManager to use storage bridge

**Current code (sessionCardManager.ts):**
```typescript
// Old way - direct sessionStorage
function saveSessionState(state: SessionCardState): boolean {
  return universalStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

function getSessionState(): SessionCardState {
  const stored = universalStorage.getItem(SESSION_STORAGE_KEY);
  return stored ? JSON.parse(stored) : defaultState;
}
```

**New way - using storage bridge:**
```typescript
import { addCards, getCards, markCardsAsShown, getUnshownCards } from '@/lib/cardStorageBridge';

// When adding new cards
async function saveCards(cards: SessionCard[]): Promise<boolean> {
  return await addCards(cards);
}

// When getting cards
function getAvailableCards(): SessionCard[] {
  return getUnshownCards(); // Fast sync call, backed by IndexedDB
}

// When marking as shown
async function updateShownCards(cardIds: string[]): Promise<boolean> {
  return await markCardsAsShown(cardIds);
}
```

#### Step 2: Update these specific functions in sessionCardManager.ts

1. **`refreshSessionCards()` line ~400-529**
   - Change: After downloading cards, use `await addCards(newSessionCards)` instead of `saveSessionState()`

2. **`getRandomPack()` line ~562-615**
   - Change: Use `const availableCards = getUnshownCards()` instead of filtering sessionState

3. **`markCardsAsShown()` line ~607-630**
   - Change: Use `await markCardsAsShown(cardIds)` from bridge

4. **`removeCardsFromSession()` line ~709-728**
   - Change: Use `await deleteCards(cardIds)` from bridge

5. **`getSessionStats()` line ~797-807**
   - Change: Use `await getStorageStats()` from bridge

#### Step 3: Test thoroughly

1. Test pack opening with new storage
2. Verify migration works for existing users
3. Check storage quota isn't exceeded
4. Test on devices with low storage

---

### Option B: Complete Rewrite (More Work, Cleaner Result)

Replace sessionCardManager entirely with a new version built on IndexedDB.

**Pros:**
- Cleaner architecture
- No legacy code
- Full async/await throughout

**Cons:**
- More refactoring needed
- Higher risk of bugs
- Existing code must be updated

---

## 📊 Benefits After Full Integration

| Aspect | Before (sessionStorage) | After (IndexedDB) |
|--------|------------------------|-------------------|
| **Storage Capacity** | 5-10MB | 50MB-1GB+ |
| **Card Limit** | 32 cards | 100+ cards |
| **Performance** | Sync but blocking | Async non-blocking |
| **Reliability** | Can fail silently | Proper error handling |
| **User Experience** | "Storage full" errors | Smooth operation |

---

## 🐛 Common Issues & Solutions

### Issue: "getSessionState is not async"
**Solution:** Use the storage bridge which provides sync methods backed by IndexedDB cache.

### Issue: Storage quota exceeded
**Solution:** IndexedDB has 10x more capacity. Run `indexedDBManager.estimateStorage()` to check.

### Issue: Migration failed
**Solution:** Migration is non-destructive. Old data stays in sessionStorage. Check browser console for errors.

### Issue: Cache out of sync with IndexedDB
**Solution:** Call `warmupCache()` to refresh. App does this automatically on startup.

---

## 🧪 Testing Checklist

- [ ] Fresh install (no existing data)
- [ ] Upgrade from existing sessionStorage data
- [ ] Pack opening with 8+ cards
- [ ] Mark cards as shown/unshown
- [ ] Delete cards from storage
- [ ] Storage quota near limit
- [ ] Browser refresh preserves data
- [ ] Multiple tabs open simultaneously
- [ ] IndexedDB disabled/unsupported
- [ ] Network offline

---

## 📝 Example: Converting a Function

**Before (sessionCardManager.ts):**
```typescript
export function getRandomPack(): { cards: SessionCard[], needsRefresh: boolean } {
  const sessionState = getSessionState(); // Sync
  const availableCards = sessionState.cards.filter(card =>
    !sessionState.shownCardIds.includes(card.id)
  );
  return { cards: availableCards.slice(0, 8), needsRefresh: false };
}
```

**After (using storage bridge):**
```typescript
export function getRandomPack(): { cards: SessionCard[], needsRefresh: boolean } {
  const availableCards = getUnshownCards(); // Sync, backed by IndexedDB
  const needsRefresh = availableCards.length < REFRESH_THRESHOLD;
  return { cards: availableCards.slice(0, 8), needsRefresh };
}
```

**Key changes:**
1. Simpler code (no filtering logic)
2. Same sync API (no breaking changes)
3. Backed by IndexedDB (more reliable)

---

## 🚀 Quick Start: Enable IndexedDB Now

**Minimal changes to start using IndexedDB:**

1. Import the bridge:
```typescript
import * as cardStorage from '@/lib/cardStorageBridge';
```

2. Replace direct storage calls:
```typescript
// Old
sessionStorage.setItem('cards', JSON.stringify(cards));

// New
await cardStorage.addCards(cards);
```

3. That's it! The bridge handles everything else.

---

## 🔮 Future Enhancements

Once basic integration is complete, consider:

1. **Lazy loading images** - Load card images on demand from IndexedDB
2. **Background sync** - Sync cards in service worker
3. **Offline mode** - Full offline pack opening
4. **Storage compression** - Further compress images in IndexedDB
5. **Progressive enhancement** - Download more cards as storage allows

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Run `indexedDBManager.estimateStorage()` to check quota
3. Clear IndexedDB: `await indexedDBManager.clearAllCards()`
4. Reset migration: `await resetMigration()`

---

**Last Updated:** 2025-10-30
**Status:** Infrastructure complete, integration in progress
**Next Step:** Update sessionCardManager.ts to use cardStorageBridge
