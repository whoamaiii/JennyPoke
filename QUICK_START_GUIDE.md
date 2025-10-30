# Quick Start Guide - Enhanced Pack Opening

## 🚀 Get Started in 3 Steps

### 1. Start the App
```bash
npm run dev
```

### 2. Try the New Features

**Home Screen:**
- Click **"Choose Pack Type"** to select from 4 pack types
- Or click **"Quick Open"** for instant standard pack

**Header Controls (Top Right):**
- ⚡ **Animation Speed** - Fast, Normal, or Cinematic
- 🔊 **Audio Controls** - Volume slider and mute
- 🌙 **Theme Toggle** - Dark/light mode
- 🔧 **Dev Mode** - Development tools

### 3. Optional: Add Sound Effects

Download free sounds from:
- Freesound.org
- Pixabay
- Zapsplat

Place 7 MP3 files in `/public/sounds/`:
- pack-rustle.mp3
- pack-rip.mp3
- card-whoosh.mp3
- card-reveal.mp3
- rare-chime.mp3
- sparkle.mp3
- anticipation.mp3

See [public/sounds/README.md](public/sounds/README.md) for details.

---

## 📦 Pack Types

| Pack | Cards | Guaranteed Rare | Ultra-Rare Odds | Design |
|------|-------|----------------|-----------------|--------|
| **Standard** | 8 | ❌ | 2% | Blue gradient |
| **Premium** | 10 | ✅ | 5% | Silver metallic |
| **Ultra Premium** | 12 | ✅ | 10% | Gold foil |
| **Mystery** | 8 | ❌ | 10% | Purple nebula |

---

## 🎬 Animation Flow

1. **Pack Selection** - Choose your pack type
2. **Enhanced Opening** - 4-phase animation (~2.2s)
   - Anticipation (glow + pulse)
   - Shake (3D rotation + sparkles)
   - Burst (particle explosion)
   - Reveal (cards appear)
3. **Rare Card Reveal** - Spotlight for rare cards (3s each)
4. **Card Fan Preview** - See all cards (2s)
5. **Card Viewer** - Swipe through (interactive)

---

## 🎮 Controls

### Animation Speed
- **Fast**: 1.5x speed (~1.5 seconds)
- **Normal**: Default speed (~2.2 seconds) ⭐ Recommended
- **Cinematic**: 0.75x speed (~4+ seconds)

### Audio
- **Mute/Unmute**: Click volume icon
- **Volume**: Drag slider (0-100%)
- Settings auto-save to localStorage

### Card Viewer
- **Swipe Left**: Add to favorites (❤️)
- **Swipe Right**: Dismiss (✖️)
- **Tap Card**: Flip to see back
- **Arrow Keys**: Navigate (desktop)

---

## 📁 File Structure

```
src/
├── components/
│   ├── EnhancedPackOpening.tsx    ← Main pack opening
│   ├── RareCardReveal.tsx         ← Rare spotlight
│   ├── CardFanPreview.tsx         ← Fan preview
│   ├── PackSelection.tsx          ← Pack chooser
│   ├── AudioControls.tsx          ← Audio UI
│   └── AnimationSpeedControl.tsx  ← Speed UI
├── lib/
│   └── audioManager.ts            ← Audio system
├── data/
│   └── packTypes.ts               ← Pack configs
└── pages/
    └── Index.tsx                  ← Main integration

public/
└── sounds/                        ← Sound effects
```

---

## 🐛 Troubleshooting

### No Sound?
- Check `/public/sounds/` directory exists
- Verify file names match exactly
- User must interact with page first (browser restriction)
- Check mute button isn't enabled

### Animations Choppy?
- Try "Fast" speed setting
- Close other browser tabs
- Check browser performance

### Pack Selection Not Working?
- Wait for "Preparing Cards..." to finish
- Check network connection
- Check browser console for errors

---

## 🎨 Customization

### Add More Pack Types
Edit `src/data/packTypes.ts`:
```typescript
{
  id: 'mega-pack',
  name: 'Mega Pack',
  description: '15 cards with amazing odds!',
  design: 'ultra',
  cardCount: 15,
  rarityWeights: {
    common: 0.30,
    uncommon: 0.40,
    rare: 0.20,
    'ultra-rare': 0.10
  },
  guaranteedRare: true,
}
```

### Change Animation Speed
Edit `src/components/EnhancedPackOpening.tsx` (lines 31-36):
```typescript
const speedMultiplier = {
  fast: 2.0,    // Change from 1.5
  normal: 1,
  cinematic: 0.5 // Change from 0.75
}[animationSpeed];
```

---

## 📚 Full Documentation

- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Complete feature list
- **[PACK_OPENING_INTEGRATION_GUIDE.md](PACK_OPENING_INTEGRATION_GUIDE.md)** - Technical details
- **[public/sounds/README.md](public/sounds/README.md)** - Sound setup guide

---

## ✨ Features Summary

✅ 4-phase animated pack opening
✅ 7 synced sound effects
✅ 4 unique pack types
✅ Rare card spotlight reveals
✅ Card fan preview
✅ Animation speed control
✅ Volume controls
✅ Mobile responsive
✅ Accessibility support
✅ Settings persistence

**Your pack opening experience is now production-ready! 🎉**
