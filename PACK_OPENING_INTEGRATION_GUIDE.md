# Pack Opening System - Integration Guide

All 4 phases of the enhanced pack opening system have been implemented! This guide shows you how to integrate everything into your application.

---

## Table of Contents
1. [What's Been Implemented](#whats-been-implemented)
2. [Quick Start](#quick-start)
3. [Integration Steps](#integration-steps)
4. [Component API Reference](#component-api-reference)
5. [Sound Files Setup](#sound-files-setup)
6. [Customization Options](#customization-options)

---

## What's Been Implemented

### ✅ Phase 1: Enhanced Pack Opening Animation
- **[EnhancedPackOpening.tsx](src/components/EnhancedPackOpening.tsx)** - 4-phase animation system
- **[pack-opening.css](src/styles/pack-opening.css)** - Custom animations & pack designs
- **[CardViewer.tsx](src/components/CardViewer.tsx)** - Enhanced card flying entrance
- Features: Anticipation, shake, burst, reveal phases with particles & 3D effects

### ✅ Phase 2: Sound & Audio Effects
- **[AudioManager.ts](src/lib/audioManager.ts)** - Complete audio system
- **[AudioControls.tsx](src/components/AudioControls.tsx)** - Volume & mute UI
- **[sounds/README.md](public/sounds/README.md)** - Sound setup guide
- Features: 7 sound effects, volume control, localStorage persistence

### ✅ Phase 3: Advanced Visual Polish
- **[RareCardReveal.tsx](src/components/RareCardReveal.tsx)** - Spotlight effect for rare cards
- **[AnimationSpeedControl.tsx](src/components/AnimationSpeedControl.tsx)** - Speed settings UI
- **[useAnimationSpeed.ts](src/hooks/useAnimationSpeed.ts)** - Speed preference hook
- **[CardFanPreview.tsx](src/components/CardFanPreview.tsx)** - Card fan layout preview
- Features: Rare card celebrations, speed control (fast/normal/cinematic), card preview

### ✅ Phase 4: Pack Variety System
- **[pokemon.ts](src/types/pokemon.ts)** - Pack type definitions
- **[packTypes.ts](src/data/packTypes.ts)** - 4 predefined pack types
- **[PackSelection.tsx](src/components/PackSelection.tsx)** - Pack chooser UI
- Features: Different pack designs, rarity odds, guaranteed rares

---

## Quick Start

### Option 1: Simple Integration (Replace Current PackOpening)

Replace your current `PackOpening` component with `EnhancedPackOpening`:

```tsx
import { EnhancedPackOpening } from '@/components/EnhancedPackOpening';
import { useAnimationSpeed } from '@/hooks/useAnimationSpeed';

// In your Index.tsx or main component:
const [animationSpeed] = useAnimationSpeed();
const hasRareCard = currentPack.some(card =>
  ['rare', 'ultra-rare'].includes(card.rarity)
);

{view === 'opening' && (
  <EnhancedPackOpening
    onComplete={() => setView('viewing')}
    hasRareCard={hasRareCard}
    animationSpeed={animationSpeed}
    packDesign="standard"
    cardCount={currentPack.length}
  />
)}
```

### Option 2: Full Integration (All Features)

Complete flow with pack selection, animations, and previews:

```tsx
import { PackSelection } from '@/components/PackSelection';
import { EnhancedPackOpening } from '@/components/EnhancedPackOpening';
import { CardFanPreview } from '@/components/CardFanPreview';
import { RareCardReveal } from '@/components/RareCardReveal';
import { CardViewer } from '@/components/CardViewer';
import { useAnimationSpeed } from '@/hooks/useAnimationSpeed';
import { PackType } from '@/types/pokemon';

// State management
type View = 'pack-selection' | 'opening' | 'fan-preview' | 'rare-reveal' | 'viewing' | 'completed';
const [view, setView] = useState<View>('pack-selection');
const [selectedPackType, setSelectedPackType] = useState<PackType | null>(null);
const [animationSpeed] = useAnimationSpeed();

// Flow logic
const hasRareCard = currentPack.some(card => ['rare', 'ultra-rare'].includes(card.rarity));
const rareCards = currentPack.filter(card => ['rare', 'ultra-rare'].includes(card.rarity));

// Render flow
{view === 'pack-selection' && (
  <PackSelection
    onSelectPack={(packType) => {
      setSelectedPackType(packType);
      // Generate pack based on packType
      handleOpenPack(packType);
      setView('opening');
    }}
  />
)}

{view === 'opening' && (
  <EnhancedPackOpening
    onComplete={() => {
      if (hasRareCard) {
        setView('rare-reveal');
      } else {
        setView('fan-preview');
      }
    }}
    hasRareCard={hasRareCard}
    animationSpeed={animationSpeed}
    packDesign={selectedPackType?.design || 'standard'}
    cardCount={currentPack.length}
  />
)}

{view === 'rare-reveal' && rareCards.length > 0 && (
  <RareCardReveal
    card={rareCards[0]}
    onComplete={() => setView('fan-preview')}
    duration={3000}
  />
)}

{view === 'fan-preview' && (
  <CardFanPreview
    cards={currentPack}
    onComplete={() => setView('viewing')}
    duration={2000}
  />
)}

{view === 'viewing' && (
  <CardViewer
    cards={currentPack}
    onSwipe={handleSwipe}
    onComplete={() => setView('completed')}
  />
)}
```

---

## Integration Steps

### Step 1: Add UI Controls to Navigation

Add the audio and animation controls to your app header/navigation:

```tsx
import { AudioControls } from '@/components/AudioControls';
import { AnimationSpeedControl } from '@/components/AnimationSpeedControl';

// In your header/navigation component:
<div className="flex items-center gap-2">
  <AnimationSpeedControl />
  <AudioControls />
  {/* Your other controls */}
</div>
```

### Step 2: Update Pack Opening Handler

Modify your `handleOpenPack` function to accept pack types:

```tsx
const handleOpenPack = async (packType?: PackType) => {
  try {
    // Use pack type configuration for rarity odds
    const rarityWeights = packType?.rarityWeights || {
      common: 0.60,
      uncommon: 0.30,
      rare: 0.08,
      'ultra-rare': 0.02
    };

    // Generate pack with weighted rarities
    const pack = await generatePackWithWeights(
      packType?.cardCount || 8,
      rarityWeights
    );

    setCurrentPack(pack);
    setView('opening');
  } catch (error) {
    console.error('Error opening pack:', error);
  }
};
```

### Step 3: Add Pack Generation Function

Create a helper to generate packs based on rarity weights:

```tsx
const generatePackWithWeights = async (
  cardCount: number,
  weights: RarityWeights
): Promise<CardData[]> => {
  const pack: CardData[] = [];

  for (let i = 0; i < cardCount; i++) {
    const rand = Math.random();
    let rarity: CardData['rarity'];

    if (rand < weights['ultra-rare']) {
      rarity = 'ultra-rare';
    } else if (rand < weights['ultra-rare'] + weights.rare) {
      rarity = 'rare';
    } else if (rand < weights['ultra-rare'] + weights.rare + weights.uncommon) {
      rarity = 'uncommon';
    } else {
      rarity = 'common';
    }

    // Get random card of this rarity from your card pool
    const card = await getRandomCardByRarity(rarity);
    pack.push(card);
  }

  return pack;
};
```

### Step 4: Initialize Audio on App Mount

The audio system auto-initializes, but you can manually init if needed:

```tsx
import { audioManager } from '@/lib/audioManager';

useEffect(() => {
  // Optional: Preload sounds on app mount
  audioManager.preload().then(() => {
    console.log('Audio system ready');
  });
}, []);
```

---

## Component API Reference

### EnhancedPackOpening

```tsx
interface EnhancedPackOpeningProps {
  onComplete: () => void;           // Called when animation finishes
  packDesign?: PackDesign;          // 'standard' | 'premium' | 'ultra' | 'mystery'
  hasRareCard?: boolean;            // Triggers special rare effects
  animationSpeed?: AnimationSpeed;  // 'fast' | 'normal' | 'cinematic'
  cardCount?: number;               // Number of cards in pack
}
```

### RareCardReveal

```tsx
interface RareCardRevealProps {
  card: CardData;         // The rare card to showcase
  onComplete: () => void; // Called after duration
  duration?: number;      // Time to show (default: 3000ms)
}
```

### CardFanPreview

```tsx
interface CardFanPreviewProps {
  cards: CardData[];      // All cards to display in fan
  onComplete: () => void; // Called when user continues
  duration?: number;      // Auto-advance time (default: 2000ms)
}
```

### PackSelection

```tsx
interface PackSelectionProps {
  onSelectPack: (packType: PackType) => void; // Called when user chooses pack
}
```

### AudioControls

No props needed - manages its own state with localStorage.

### AnimationSpeedControl

No props needed - uses `useAnimationSpeed` hook internally.

---

## Sound Files Setup

### Required Files

Place these MP3 files in `/public/sounds/`:

1. **pack-rustle.mp3** - Pack shaking sound (loop)
2. **pack-rip.mp3** - Pack tearing/opening
3. **card-whoosh.mp3** - Cards flying out
4. **card-reveal.mp3** - Card flip reveal
5. **rare-chime.mp3** - Rare card indicator
6. **sparkle.mp3** - Sparkle effect
7. **anticipation.mp3** - Build-up sound (loop)

### Where to Get Sounds

See **[public/sounds/README.md](public/sounds/README.md)** for:
- Free sound effect sources (Freesound.org, Pixabay, etc.)
- File format requirements
- Editing tips with Audacity
- Volume normalization guide

### App Works Without Sounds

The audio system gracefully handles missing files:
- Console warnings (check dev tools)
- Animations continue silently
- No errors or crashes

---

## Customization Options

### Add More Pack Types

Edit **[src/data/packTypes.ts](src/data/packTypes.ts)**:

```tsx
{
  id: 'mega-pack',
  name: 'Mega Pack',
  description: 'Extra large with guaranteed ultra-rares!',
  design: 'ultra',
  cardCount: 15,
  rarityWeights: {
    common: 0.20,
    uncommon: 0.40,
    rare: 0.30,
    'ultra-rare': 0.10
  },
  guaranteedRare: true,
}
```

### Create Custom Pack Designs

Add to **[src/styles/pack-opening.css](src/styles/pack-opening.css)**:

```css
.pack-custom {
  background: linear-gradient(135deg, #your-colors);
  background-size: 200% 200%;
  animation: custom-shine 2s ease-in-out infinite;
}

@keyframes custom-shine {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

Then use in **EnhancedPackOpening.tsx**:
```tsx
export type PackDesign = 'standard' | 'premium' | 'ultra' | 'mystery' | 'custom';
```

### Adjust Animation Timings

In **[EnhancedPackOpening.tsx](src/components/EnhancedPackOpening.tsx)**, modify phase durations:

```tsx
// Faster anticipation
tl.to(packRef.current, {
  scale: 1.05,
  duration: 0.2 / speedMultiplier, // Changed from 0.4
  // ...
});
```

### Add More Sound Effects

1. Add sound file to `/public/sounds/`
2. Add to AudioManager type in **[audioManager.ts](src/lib/audioManager.ts)**:
```tsx
export type SoundEffect =
  | 'pack-rustle'
  | 'my-new-sound' // Add here
  | ...
```
3. Add configuration:
```tsx
'my-new-sound': {
  src: '/sounds/my-new-sound.mp3',
  volume: 0.7
}
```
4. Use in components:
```tsx
audioManager.play('my-new-sound');
```

---

## Testing Checklist

- [ ] Pack selection screen displays all 4 pack types
- [ ] Clicking a pack shows selection state
- [ ] "Open Pack" button triggers pack opening
- [ ] Anticipation phase shows glow and "Get ready..." text
- [ ] Shake animation has 3D rotation (check for rare = more intense)
- [ ] Confetti particles appear during shake (gold for rare)
- [ ] Pack burst creates particle explosion
- [ ] Cards transition to viewer (first card flies in)
- [ ] Rare cards trigger special RareCardReveal component
- [ ] Card fan preview shows all cards in arc formation
- [ ] Audio controls (mute/volume) work and persist
- [ ] Animation speed control changes pack opening speed
- [ ] All animations work on mobile (responsive)
- [ ] Reduced motion preference disables animations

---

## Performance Tips

1. **Preload Images**: CardViewer already prefetches next 2 cards
2. **Audio Loading**: Sounds load on first user interaction
3. **Confetti Limits**: Reduced particle count on mobile
4. **GSAP Cleanup**: All timelines are properly killed on unmount
5. **localStorage**: Audio/speed preferences cached locally

---

## Troubleshooting

### Animations Not Playing
- Check browser console for errors
- Verify GSAP is imported correctly
- Ensure pack-opening.css is imported in main.tsx

### Sounds Not Working
- Check `/public/sounds/` directory exists
- Verify file names match exactly (case-sensitive)
- Look for console warnings about missing files
- Ensure user has interacted with page (auto-play restrictions)

### Pack Selection Not Showing
- Verify `PACK_TYPES` import from packTypes.ts
- Check if Badge/Card shadcn components exist
- Look for TypeScript errors in console

### Performance Issues
- Reduce confetti particleCount in EnhancedPackOpening.tsx
- Set animationSpeed to 'fast'
- Disable showRareReveal and showFanPreview

---

## File Structure Summary

```
src/
├── components/
│   ├── EnhancedPackOpening.tsx      ← Main pack opening
│   ├── RareCardReveal.tsx           ← Rare card spotlight
│   ├── CardFanPreview.tsx           ← Card fan preview
│   ├── PackSelection.tsx            ← Pack chooser UI
│   ├── AudioControls.tsx            ← Audio settings
│   ├── AnimationSpeedControl.tsx    ← Speed settings
│   └── CardViewer.tsx               ← Updated with flying entrance
├── lib/
│   └── audioManager.ts              ← Audio system
├── hooks/
│   └── useAnimationSpeed.ts         ← Speed preference hook
├── data/
│   └── packTypes.ts                 ← Pack definitions
├── types/
│   └── pokemon.ts                   ← Updated with pack types
└── styles/
    └── pack-opening.css             ← Pack animations

public/
└── sounds/                          ← Sound effect files
    └── README.md                    ← Sound setup guide
```

---

## Next Steps

1. **Test the Basic Flow**: Try Option 1 (Simple Integration) first
2. **Add Sound Files**: Follow public/sounds/README.md
3. **Implement Full Flow**: Use Option 2 for complete experience
4. **Customize Packs**: Add your own pack types
5. **Style to Match**: Adjust colors/themes to your design
6. **Optimize**: Monitor performance and adjust particle counts

---

## Need Help?

- Check component source files for inline comments
- Review TypeScript interfaces for prop types
- Test individual components in isolation
- Use browser DevTools to debug animations

Happy pack opening! 🎉
