# 🔧 Dev Mode - READY TO TEST!

## ✅ Dev Mode Successfully Created!

You now have a **Dev Mode** that **guarantees at least 1 holographic card in every pack** for easy testing!

---

## 🚀 How to Use Dev Mode

### Step 1: Enable Dev Mode

**Option A: Use the UI Toggle (Easiest)**
1. Go to http://localhost:8080
2. Look for the **Settings ⚙️ icon** in the **bottom-right corner**
3. Click it to open the Dev Mode panel
4. Click **"Dev Mode: OFF"** to turn it **ON**
5. You'll see a success message! ✅

**Option B: Use Browser Console**
```javascript
localStorage.setItem('pokemon-dev-mode-holo', 'true');
// Then refresh the page
```

### Step 2: Open Packs

1. Click **"Open Pack"** button
2. **Every pack will now contain at least 1 holo card!** ✨
3. Swipe through cards and reveal them
4. When you hit the holo card, **move your mouse** over it
5. **Watch the holographic effect!** 💎🌈

### Step 3: Disable Dev Mode (When Done Testing)

1. Click the Settings ⚙️ icon again
2. Click **"Dev Mode: ON"** to turn it **OFF**
3. Normal pack distribution restored!

---

## 🎯 What Dev Mode Does

### Normal Mode (Dev Mode OFF):
- Packs have **70% chance** of containing 1 holo card
- **30% chance** of getting no holo cards
- Realistic Pokemon TCG pack distribution

### Dev Mode (Dev Mode ON):
- **100% chance** of getting 1 holo card per pack
- Guaranteed holo for testing holographic effects
- Console logs show: `🔧 Dev Mode Active: Guaranteeing 1 holo card in pack`

---

## 📊 Visual Indicators

### When Dev Mode is OFF:
- Settings icon in bottom-right
- Gray button says "Dev Mode: OFF"

### When Dev Mode is ON:
- Settings icon in bottom-right
- **Blue/highlighted button** says "Dev Mode: ON"
- **Green success box** shows "✓ All packs will contain holo cards"
- Console shows dev mode messages

---

## 🧪 Testing Holographic Effects

### Perfect Testing Workflow:

1. **Enable Dev Mode** (Settings → Dev Mode: ON)
2. **Open a pack** (Click "Open Pack")
3. **Reveal cards** one by one (tap each card)
4. **Find the holo card** (will have Rare/Holo in rarity)
5. **Move mouse slowly over it** - see the rainbow shine!
6. **Try these movements:**
   - Move to corners for 3D tilt
   - Slow circles for shine shift
   - Quick movements for glare
7. **Test on multiple cards** (open more packs!)
8. **When done, disable Dev Mode**

---

## 💡 Pro Tips

### Best Cards to Test:
- **Rare Holo** - Regular rainbow effect
- **Ultra Rare** - Stronger effect
- **Secret Rare** - Special rainbow effect (if you get one!)
- **Custom advent cards** - All have effects

### Best Environment:
- **Dark mode** - Effects show better on dark background
- **Large cards** - Effects more visible on big cards
- **Smooth mouse movement** - Shows effect gradients better

### Movement Tips:
- **Slow circles** - Best way to see shine shift
- **Corner to corner** - See 3D tilt
- **Edge hover** - See glare follow cursor

---

## 🎄 Dev Mode for Advent Calendar

Dev Mode also works in the Advent Calendar!

1. Go to Advent Calendar (click "Advent")
2. Dev Mode is already on? Great!
3. Open any day's pack
4. Custom cards will have holographic effects
5. Test different days to see different effects

---

## 🔧 Technical Details

### Files Created:
1. ✅ `src/lib/devMode.ts` - Dev mode utilities
2. ✅ `src/components/DevModeToggle.tsx` - UI toggle component

### Files Modified:
1. ✅ `src/services/pokemonTcgApi.ts` - Guarantees holo in dev mode
2. ✅ `src/pages/Index.tsx` - Added dev mode toggle

### How It Works:
```typescript
// Normal: 70% chance of holo
const numRares = Math.random() < 0.7 ? 1 : 0;

// Dev Mode: 100% chance of holo
const numRares = devMode ? 1 : (Math.random() < 0.7 ? 1 : 0);
```

### Storage:
- Uses `localStorage` with key `'pokemon-dev-mode-holo'`
- Persists across page refreshes
- Can be manually cleared if needed

---

## 🐛 Troubleshooting

### Issue: Toggle not showing
**Solution:** Refresh the page (F5)

### Issue: Still no holo cards
**Solutions:**
1. Check console - should see "🔧 Dev Mode Active" message
2. Verify dev mode is ON (blue button)
3. Try clearing localStorage and re-enabling:
```javascript
localStorage.clear();
// Then enable dev mode again via UI
```

### Issue: Want to reset everything
**Solutions:**
```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();
// Refresh page
location.reload();
```

---

## 🎮 Quick Test Script

Want to test immediately? Paste this in browser console:

```javascript
// Enable dev mode
localStorage.setItem('pokemon-dev-mode-holo', 'true');

// Refresh to apply
location.reload();

// Then just open a pack!
```

---

## 📝 Remember to Disable!

**Before deploying or showing to your girlfriend:**
- **Disable Dev Mode** (Settings → OFF)
- This ensures she gets the authentic experience
- Real packs have surprise and variety!

---

## ✨ Summary

**You can now:**
- ✅ Enable Dev Mode with one click
- ✅ Get guaranteed holo cards every pack
- ✅ Test holographic effects easily
- ✅ Disable when done testing
- ✅ See visual indicators of mode status

**Dev Mode ON = Guaranteed Holo Every Pack! 🎯**

---

## 🚀 Ready to Test?

1. **Go to:** http://localhost:8080
2. **Look for:** Settings ⚙️ icon (bottom-right)
3. **Click:** Dev Mode: OFF → ON
4. **Open:** A pack
5. **Enjoy:** Guaranteed holo card with effects! ✨💎🌈

**Let me know if it works!** 🎉
