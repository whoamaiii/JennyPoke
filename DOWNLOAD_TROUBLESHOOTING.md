# 🔧 Card Download Troubleshooting Guide

If you're seeing "Failed to download cards" errors, this guide will help you debug and fix the issue.

---

## 🚨 Common Error: "Failed to download any cards"

This means all card image downloads failed. Let's figure out why!

---

## 📋 **Quick Debugging Steps**

### Step 1: Check Browser Console

1. Open browser DevTools (F12 or right-click → Inspect)
2. Go to the **Console** tab
3. Look for error messages starting with:
   - `[SessionCardManager]`
   - `ℹ️ [SessionCardManager]`
   - `❌ [SessionCardManager]`

### Step 2: What to Look For

**Good Signs (Download Working):**
```
ℹ️ [SessionCardManager] Downloading card: base1-1 from https://...
🔍 [SessionCardManager] ✓ Compressed base1-1: 65.3% reduction
```

**Bad Signs (Download Failing):**
```
❌ [SessionCardManager] Image download failed for base1-1: ...
❌ [SessionCardManager] Failed to download base1-1: ...
```

---

## 🐛 **Common Issues & Solutions**

### Issue 1: CORS Errors
**Error in console:**
```
Access to fetch at 'https://images.pokemontcg.io/...' from origin 'http://localhost:8080'
has been blocked by CORS policy
```

**Solution:**
The Pokemon TCG API should support CORS. If you see this:
1. Check your browser settings
2. Try a different browser (Chrome, Firefox)
3. Make sure you're not using browser extensions that block requests

---

### Issue 2: Network Errors
**Error in console:**
```
Failed to fetch
TypeError: NetworkError
```

**Solutions:**
1. **Check internet connection**
   ```bash
   # Test if you can reach the API
   curl -I https://images.pokemontcg.io/base1/1.png
   ```

2. **Check if API is down**
   - Visit: https://pokemontcg.io/
   - Check status

3. **Firewall/VPN issues**
   - Disable VPN temporarily
   - Check firewall settings

---

### Issue 3: Image URLs Are Wrong
**Error in console:**
```
❌ [SessionCardManager] Image download failed for base1-1: 404 Not Found
```

**Check CSV file:**
```bash
# Look at your CSV to see if URLs are correct
head -5 public/downloaded_cards.csv
```

**Expected format:**
```csv
set_id,set_name,card_number,...,image_url,...
base1,Base,1,...,https://images.pokemontcg.io/base1/1_hires.png,...
```

**Solution:**
- URLs should start with `https://images.pokemontcg.io/`
- Format: `{set_id}/{card_number}_hires.png`
- The code will automatically try fallback without `_hires` if needed

---

### Issue 4: All Cards Failing (0% Success)
**Error in console:**
```
❌ [SessionCardManager] Failed to download any cards - all attempts failed
```

**Debug steps:**

1. **Test a single image manually:**
   ```javascript
   // Open browser console and run:
   fetch('https://images.pokemontcg.io/base1/1_hires.png')
     .then(r => console.log('Success:', r.status))
     .catch(e => console.error('Failed:', e));
   ```

2. **Check CSV is loading:**
   ```javascript
   // In console:
   fetch('/downloaded_cards.csv')
     .then(r => r.text())
     .then(t => console.log('CSV loaded, length:', t.length));
   ```

3. **Check if any cards in CSV:**
   ```bash
   wc -l public/downloaded_cards.csv
   # Should show thousands of lines
   ```

---

### Issue 5: Some Cards Fail (< 50% Success)
**Warning:**
```
Downloaded 12/32 cards. Some downloads failed.
```

**This is OK!** The app will work with partial downloads.

**Why this happens:**
- Some card images might not exist
- Network timeouts for specific cards
- API rate limiting

**Solution:**
- App automatically uses fallback URLs
- Try downloading again later
- The cards that succeeded are cached

---

## 🔍 **Advanced Debugging**

### Enable Debug Logging

1. Edit `.env.local`:
   ```
   VITE_LOG_LEVEL=debug
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Now you'll see detailed logs:
   ```
   🔍 [SessionCardManager] Downloading card: base1-1 from https://...
   🔍 [SessionCardManager] Trying fallback URL for base1-1: https://...
   🔍 [SessionCardManager] ✓ Compressed base1-1: 65.3% reduction
   ```

### Test Image Download Manually

```javascript
// In browser console:
const { downloadAndCompressImage } = await import('./src/lib/imageUtils');

// Test downloading and compressing
const result = await downloadAndCompressImage(
  'https://images.pokemontcg.io/base1/1_hires.png',
  { maxWidth: 500, maxHeight: 375, quality: 0.75, format: 'webp' }
);

console.log('Success!', result);
// If this works, the download system is fine
// If this fails, there's a network/CORS issue
```

### Check IndexedDB Storage

```javascript
// In console:
const { indexedDBManager } = await import('./src/lib/indexedDBManager');
await indexedDBManager.init();

const count = await indexedDBManager.getCardCount();
console.log('Cards in IndexedDB:', count);

const unshown = await indexedDBManager.getUnshownCardCount();
console.log('Unshown cards:', unshown);
```

---

## ✅ **Verification Steps**

After fixing issues, verify everything works:

### 1. Clear Everything
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();

const { indexedDBManager } = await import('./src/lib/indexedDBManager');
await indexedDBManager.init();
await indexedDBManager.clearAllCards();

// Reload page
location.reload();
```

### 2. Check Download Progress
1. Open browser DevTools
2. Go to **Network** tab
3. Filter by "Img"
4. Should see card images downloading
5. All should show status "200 OK"

### 3. Verify Cards Are Stored
```javascript
// After download completes:
const { getSessionStats } = await import('./src/services/sessionCardManager');
const stats = getSessionStats();
console.log('Stats:', stats);
// Should show totalCards > 0
```

---

## 🆘 **Still Not Working?**

### Collect Debug Info

Run this in browser console:
```javascript
// Collect all debug info
const debugInfo = {
  // Browser
  userAgent: navigator.userAgent,
  online: navigator.onLine,

  // Storage
  localStorage: localStorage.length,
  sessionStorage: sessionStorage.length,

  // IndexedDB
  indexedDB: 'indexedDB' in window,

  // Environment
  logLevel: import.meta.env.VITE_LOG_LEVEL,
  apiKey: import.meta.env.VITE_POKEMON_TCG_API_KEY ? 'Set' : 'Not set',
};

console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

### Test Direct Image Access

```bash
# From terminal:
curl -I https://images.pokemontcg.io/base1/1_hires.png

# Should show:
# HTTP/2 200
# content-type: image/png
```

---

## 📊 **Expected Behavior**

### Successful Download
1. Console shows: "Downloading 32 cards..."
2. Progress appears in console
3. Some cards might fail (that's OK!)
4. At least 50% should succeed
5. Toast shows: "Downloaded X cards!"
6. Can open packs immediately

### Partial Failure (Acceptable)
- Downloaded: 16-31 cards
- Warning shown
- **Can still play!**
- More cards download in background

### Complete Failure (Need to Fix)
- Downloaded: 0 cards
- Error shown
- **Cannot play**
- Follow debugging steps above

---

## 💡 **Prevention Tips**

1. **Stable Internet:** Use wired connection if possible
2. **No VPN:** Disable VPN during initial download
3. **Browser:** Use latest Chrome or Firefox
4. **Extensions:** Disable ad blockers temporarily
5. **API Key:** Verify it's in `.env.local`

---

## 📞 **Get Help**

If you're still stuck after trying everything:

1. Share console errors
2. Share network tab screenshot
3. Share output from debug info script
4. Mention your browser and OS

---

**Last Updated:** 2025-10-30
