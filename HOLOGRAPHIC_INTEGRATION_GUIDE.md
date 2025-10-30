# Holographic Pokemon Card Effects - Integration Guide

## Overview

This guide explains how to integrate realistic holographic effects from [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) into your React Pokemon card project.

The effects create stunning, realistic holographic cards using:
- **CSS 3D Transforms** - For depth and rotation
- **Multiple Blend Modes** - color-dodge, overlay, hard-light
- **Dynamic Gradients** - Rainbow shine effects
- **CSS Custom Properties** - Real-time updates via JavaScript
- **Hardware Acceleration** - Smooth 60fps animations

---

## What You Get

### Visual Effects:
1. **Regular Holo** - Classic rainbow holographic shine
2. **Cosmos Holo** - Galaxy/space effect with stars
3. **Rainbow Holo** - Secret rare rainbow effect
4. **Reverse Holo** - Pattern-based reverse holographic
5. **Glare Effect** - Cursor-following light reflection
6. **3D Tilt** - Cards rotate based on mouse position

### Interactive Features:
- Mouse tracking for dynamic effects
- Smooth spring-physics animations
- Touch support for mobile
- Type-based glow colors (Fire = orange, Water = blue, etc.)
- Rarity-based automatic effect selection

---

## Quick Start (5 Minutes)

### Step 1: Copy CSS Files

```bash
# CSS files are in holographic-effects/
# Copy to your project:
cp holographic-effects/*.css src/styles/holographic/
```

### Step 2: Install (if needed)

All dependencies are already in your project!
- ✅ GSAP (for animations)
- ✅ React/TypeScript
- ✅ Tailwind CSS

### Step 3: Import CSS

Add to `src/main.tsx`:

```typescript
import './styles/holographic/holographic.css';
```

### Step 4: Use the Hook

```typescript
import { useHolographicEffect } from '@/hooks/useHolographicEffect';

function MyCard() {
  const { cardRef } = useHolographicEffect({
    enabled: true,
    intensity: 1
  });

  return (
    <div ref={cardRef} className="card" data-rarity="rare holo">
      {/* card content */}
    </div>
  );
}
```

---

## Implementation Options

### Option A: Full Implementation (Recommended)
**Time:** 2-3 hours
**Includes:** All effects, full customization, performance optimization

Follow the detailed steps below.

### Option B: Quick Integration
**Time:** 30 minutes
**Includes:** Basic holographic effect on existing cards

I'll create pre-configured files you can drop in.

### Option C: Gradual Integration
**Time:** 4-6 hours
**Includes:** Step-by-step with testing at each phase

Perfect for learning and customization.

---

## Detailed Implementation (Option A)

### Phase 1: CSS Setup (30 minutes)

#### 1.1: Create CSS File Structure

```bash
src/
  styles/
    holographic/
      holographic.css     # Main file (imports all others)
      variables.css       # CSS custom properties
      base.css           # Core structure
      effects.css        # Holographic effects
```

#### 1.2: Create Combined Holographic CSS

I'll provide a single file that combines everything, already adapted for React.

Key changes from Svelte version:
- Removed `:global()` wrappers
- Updated image paths
- Added fallbacks for missing textures
- Optimized for React rendering

---

### Phase 2: React Hook (45 minutes)

Create `src/hooks/useHolographicEffect.ts`:

```typescript
import { useRef, useEffect } from 'react';

interface HolographicOptions {
  enabled?: boolean;
  intensity?: number;
  rotationLimit?: number;
}

export const useHolographicEffect = (options: HolographicOptions = {}) => {
  const { enabled = true, intensity = 1, rotationLimit = 20 } = options;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !cardRef.current) return;

    const card = cardRef.current;
    let animationFrame: number;

    const handlePointerMove = (e: PointerEvent) => {
      if (animationFrame) cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();

        // Calculate percentages
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;

        // Calculate center-relative (-0.5 to 0.5)
        const centerX = (px / 100) - 0.5;
        const centerY = (py / 100) - 0.5;

        // Calculate distance from center
        const distance = Math.sqrt(centerX ** 2 + centerY ** 2);
        const normalizedDistance = Math.min(distance / 0.707, 1);

        // Calculate rotations
        const rotateY = centerX * rotationLimit * intensity;
        const rotateX = -centerY * (rotationLimit * 0.8) * intensity;

        // Update CSS variables
        card.style.setProperty('--pointer-x', `${px}%`);
        card.style.setProperty('--pointer-y', `${py}%`);
        card.style.setProperty('--pointer-from-center', String(normalizedDistance));
        card.style.setProperty('--pointer-from-left', String(px / 100));
        card.style.setProperty('--pointer-from-top', String(py / 100));
        card.style.setProperty('--card-opacity', String(intensity));
        card.style.setProperty('--rotate-x', `${rotateX}deg`);
        card.style.setProperty('--rotate-y', `${rotateY}deg`);

        // Background position for shine
        const bgX = 37 + (centerX + 0.5) * 26;
        const bgY = 33 + (centerY + 0.5) * 34;
        card.style.setProperty('--background-x', `${bgX}%`);
        card.style.setProperty('--background-y', `${bgY}%`);
      });
    };

    const handlePointerLeave = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);

      // Reset to neutral
      card.style.setProperty('--card-opacity', '0');
      card.style.setProperty('--rotate-x', '0deg');
      card.style.setProperty('--rotate-y', '0deg');
      card.style.setProperty('--pointer-x', '50%');
      card.style.setProperty('--pointer-y', '50%');
      card.style.setProperty('--background-x', '50%');
      card.style.setProperty('--background-y', '50%');
    };

    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      card.removeEventListener('pointermove', handlePointerMove);
      card.removeEventListener('pointerleave', handlePointerLeave);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [enabled, intensity, rotationLimit]);

  return { cardRef };
};
```

---

### Phase 3: Update PokemonCard Component (45 minutes)

Modify your existing `src/components/PokemonCard.tsx`:

**Key Changes:**
1. Add holographic layers (shine, glare divs)
2. Apply data-rarity attribute
3. Apply type classes for glow colors
4. Use useHolographicEffect hook

**Example Integration:**

```typescript
import { useHolographicEffect } from '@/hooks/useHolographicEffect';

export const PokemonCard = ({ card, enableHolo = true }) => {
  const { card: tcgCard } = card;

  // Determine if this card should have holographic effect
  const isHoloCard = tcgCard.rarity?.toLowerCase().includes('holo') ||
                     tcgCard.rarity?.toLowerCase().includes('rare');

  const shouldApplyHolo = enableHolo && isHoloCard;

  const { cardRef } = useHolographicEffect({
    enabled: shouldApplyHolo,
    intensity: 1,
    rotationLimit: 18
  });

  // Map types to CSS classes
  const typeClass = tcgCard.types?.[0]?.toLowerCase() || '';

  // Map rarity to data attribute
  const rarityAttr = mapRarity(tcgCard.rarity);

  return (
    <div
      ref={cardRef}
      className={`card interactive ${typeClass}`}
      data-rarity={rarityAttr}
    >
      <div className="card__translater">
        <div className="card__rotator">
          <div className="card__front">
            <img src={tcgCard.images.large} alt={tcgCard.name} />

            {/* Holographic layers */}
            {shouldApplyHolo && (
              <>
                <div className="card__shine" />
                <div className="card__glare" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function mapRarity(rarity: string): string {
  const r = rarity?.toLowerCase() || '';
  if (r.includes('rainbow')) return 'rare rainbow';
  if (r.includes('cosmos')) return 'rare holo cosmos';
  if (r.includes('reverse')) return 'reverse holo';
  if (r.includes('holo')) return 'rare holo';
  return r;
}
```

---

### Phase 4: Testing (30 minutes)

Create a test page to see all effects:

```typescript
// src/pages/HolographicTest.tsx
import { PokemonCard } from '@/components/PokemonCard';

const testCards = [
  { rarity: 'Rare Holo', types: ['Fire'], name: 'Charizard', /* ... */ },
  { rarity: 'Rare Holo Cosmos', types: ['Water'], name: 'Blastoise', /* ... */ },
  { rarity: 'Rare Rainbow', types: ['Lightning'], name: 'Pikachu', /* ... */ },
];

export const HolographicTest = () => (
  <div className="grid grid-cols-3 gap-8 p-8 bg-gray-900">
    {testCards.map(card => (
      <PokemonCard key={card.name} card={card} enableHolo={true} />
    ))}
  </div>
);
```

---

## CSS Structure Explained

### Layer Architecture:

```
┌─────────────────────────────────┐
│  .card__rotator (3D container)  │
│  ┌───────────────────────────┐  │
│  │  .card__front             │  │
│  │  ├─ <img> (card image)    │  │
│  │  ├─ .card__shine (holo)   │  │
│  │  └─ .card__glare (light)  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Key CSS Properties:

```css
.card__shine {
  /* Rainbow gradient that moves with cursor */
  background: linear-gradient(110deg,
    var(--violet), var(--blue), var(--green),
    var(--yellow), var(--red));
  background-position: var(--background-x) var(--background-y);
  background-size: 400% 400%;

  /* Blend mode creates holographic effect */
  mix-blend-mode: color-dodge;
  filter: brightness(1.1) contrast(1.1) saturate(1.2);
}

.card__glare {
  /* Radial gradient following cursor */
  background: radial-gradient(
    circle at var(--pointer-x) var(--pointer-y),
    rgba(255,255,255,0.8) 10%,
    transparent 90%
  );
  mix-blend-mode: overlay;
}
```

---

## Rarity Types Supported

| Rarity | Effect | Description |
|--------|--------|-------------|
| `rare holo` | Rainbow gradient | Classic holographic |
| `rare holo cosmos` | Galaxy effect | Space/cosmic pattern |
| `rare rainbow` | Rainbow secret | Intense multi-color |
| `reverse holo` | Pattern holo | Reverse style |
| `common` | None | Regular card |

---

## Type-Based Glow Colors

The card edge glows based on Pokemon type:

```css
.card.fire        { --card-glow: hsl(9, 81%, 59%); }    /* Orange */
.card.water       { --card-glow: hsl(192, 97%, 60%); }  /* Blue */
.card.grass       { --card-glow: hsl(96, 81%, 65%); }   /* Green */
.card.lightning   { --card-glow: hsl(54, 87%, 63%); }   /* Yellow */
.card.psychic     { --card-glow: hsl(281, 62%, 58%); }  /* Purple */
.card.fighting    { --card-glow: hsl(14, 100%, 62%); }  /* Red */
.card.darkness    { --card-glow: hsl(0, 0%, 35%); }     /* Dark Gray */
.card.metal       { --card-glow: hsl(210, 20%, 60%); }  /* Silver */
.card.dragon      { --card-glow: hsl(280, 77%, 60%); }  /* Purple */
.card.fairy       { --card-glow: hsl(328, 100%, 75%); } /* Pink */
```

---

## Performance Optimization

### 1. Hardware Acceleration
Already enabled via `translate3d(0,0,0.01px)`

### 2. Will-Change
```css
.card__shine, .card__glare {
  will-change: transform, opacity;
}
```

### 3. RequestAnimationFrame
Hook uses RAF for smooth 60fps updates

### 4. Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .card, .card * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 5. Mobile Optimization
- Reduce intensity on mobile: `intensity={0.7}`
- Disable certain blend modes
- Limit rotation: `rotationLimit={12}`

---

## Troubleshooting

### Issue: No effect visible
**Solution:**
- Check data-rarity attribute is set correctly
- Ensure CSS is imported
- Verify card has `.interactive` class

### Issue: Performance lag
**Solution:**
- Reduce intensity to 0.5-0.7
- Lower rotationLimit to 10-15
- Check for other heavy animations

### Issue: Wrong colors
**Solution:**
- Check type class is applied (`.fire`, `.water`, etc.)
- Verify CSS custom properties are loading

### Issue: Effect too subtle
**Solution:**
- Increase intensity to 1.2-1.5
- Adjust blend mode opacity in CSS
- Check lighting in your app background

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Blend Modes | ✅ | ✅ | ✅ | ✅ |
| CSS Variables | ✅ | ✅ | ✅ | ✅ |
| 3D Transforms | ✅ | ✅ | ✅ | ✅ |
| Filters | ✅ | ✅ | ✅ | ✅ |

**Minimum Versions:**
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

---

## Next Steps

1. **Test Effects** - Create test page with different rarities
2. **Adjust Intensity** - Find sweet spot for your design
3. **Add to Advent Calendar** - Make custom cards extra special
4. **Performance Test** - Check on mobile devices
5. **Customize Colors** - Tweak rainbow gradient colors

---

## Files Provided

In `holographic-effects/`:
- ✅ `base.css` - Core structure
- ✅ `cards.css` - Variables
- ✅ `regular-holo.css` - Rainbow effect
- ✅ `cosmos-holo.css` - Galaxy effect
- ✅ `rainbow-holo.css` - Secret rare
- ✅ `reverse-holo.css` - Reverse pattern
- ✅ `Card.svelte` - Reference implementation

---

## Resources

- **Original Repo:** https://github.com/simeydotme/pokemon-cards-css
- **Live Demo:** https://poke-holo.simey.me/
- **CSS Tricks:** https://css-tricks.com/almanac/properties/m/mix-blend-mode/

---

**Ready to implement?** Follow the phases above, or let me know which option (A/B/C) you'd like and I'll create the exact files you need!
