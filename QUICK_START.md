# Pokemon Advent Calendar - Quick Start

## 🎄 Your Advent Calendar is Ready!

The Christmas Advent Calendar has been successfully implemented! Here's what you need to know to make it personal and special.

## ✅ What's Already Working

1. **24-Day Calendar**: Beautiful grid layout with doors for December 1-24
2. **Date-Locked Doors**: Automatically unlock on their respective dates
3. **Progress Tracking**: Tracks which days have been opened (stored locally)
4. **Pack System**: Each day generates a special pack with 10 cards
5. **Custom Cards**: System to create personalized Pokemon cards
6. **Navigation**: Seamless switching between regular packs and advent calendar
7. **Responsive Design**: Works great on mobile and desktop

## 🚀 Next Steps to Personalize

### 1. Customize the Example Cards

Open this file:
```
src/data/custom-cards/customCardDatabase.json
```

Currently has 5 sample cards. Replace them with your own:

**Day 1 Example** (customize this):
```json
{
  "id": "custom-001",
  "baseCardId": "base1-58",
  "name": "First Date Pikachu",
  "flavorText": "Remember that coffee shop? Your smile lit up the room ☕",
  "assignedDay": 1,
  "category": "milestone"
}
```

### 2. Add Cards for All 24 Days

You need **19 more cards** (days 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23).

Copy this template for each day:
```json
{
  "id": "custom-XXX",
  "baseCardId": "POKEMON-ID",
  "name": "Your Card Name",
  "flavorText": "Your personal message here",
  "assignedDay": X,
  "category": "milestone"
}
```

### 3. Find Pokemon Card IDs

Visit https://pokemontcg.io/ to find card IDs:

Popular choices:
- `base1-4` - Charizard (epic/rare)
- `base1-7` - Squirtle (cute/friendly)
- `base1-58` - Pikachu (classic)
- `xy1-10` - Eevee (adorable)
- `sm1-149` - Snorlax (funny/lazy)
- `xy5-1` - Jigglypuff (sweet/musical)

### 4. Make Day 24 Extra Special

Day 24 should be your **best card**. It can have:
- Multiple custom attacks
- Higher HP
- Secret Rare rarity
- Your most heartfelt message

Example:
```json
{
  "id": "custom-024",
  "baseCardId": "base1-4",
  "name": "Forever Charizard",
  "nickname": "Eternal Flame",
  "hp": "150",
  "type": "Fire",
  "rarity": "Secret Rare",
  "attacks": [
    {
      "name": "Eternal Flame",
      "damage": "150",
      "description": "A love that burns forever"
    }
  ],
  "flavorText": "Merry Christmas! My love for you burns as bright as Charizard's flames ❤️",
  "assignedDay": 24,
  "category": "ultra-rare"
}
```

## 🎨 Card Categories (Use These for Organization)

- **milestone**: First date, anniversaries, big moments
- **inside-joke**: Funny memories only you two understand
- **pet**: Cards about pets or favorite animals
- **holiday**: Christmas and winter themed
- **location**: Special places you've visited together
- **ultra-rare**: Extra special cards (especially Day 24)

## 🧪 Testing Your Calendar

### Before December 1st

The calendar will show all doors, but future dates will be locked. To test:

1. Start the dev server:
```bash
npm run dev
```

2. Navigate to the Advent Calendar from the home page

3. During development, you can modify dates in:
```
src/hooks/advent/useAdventProgress.ts
```

### Resetting Progress (for testing)

Open browser console and run:
```javascript
localStorage.removeItem('advent-calendar-2024')
```

Or through DevTools:
1. F12 → Application/Storage → Local Storage
2. Find and delete `advent-calendar-2024`

## 📁 Project Structure

```
pokemonpacks/
├── src/
│   ├── components/
│   │   └── advent/
│   │       ├── AdventCalendar.tsx       (Main calendar view)
│   │       ├── CalendarDoor.tsx         (Individual door component)
│   │       └── AdventPackOpening.tsx    (Pack opening flow)
│   ├── services/
│   │   └── advent/
│   │       ├── customCardGenerator.ts   (Generates custom cards)
│   │       └── adventPackGenerator.ts   (Creates daily packs)
│   ├── hooks/
│   │   └── advent/
│   │       └── useAdventProgress.ts     (Tracks opened days)
│   ├── data/
│   │   └── custom-cards/
│   │       └── customCardDatabase.json  (YOUR CUSTOM CARDS HERE)
│   └── types/
│       └── pokemon.ts                    (TypeScript types)
├── public/
│   └── custom-cards/                    (Optional: custom images)
├── .env.local                            (Environment config)
├── ADVENT_CALENDAR_GUIDE.md             (Full documentation)
└── QUICK_START.md                        (This file)
```

## 🎯 Daily Pack Contents

The system automatically varies pack quality by day:

| Days | Custom Cards | Rares | Uncommons | Commons | Total |
|------|-------------|-------|-----------|---------|-------|
| 1-13 | Your custom | 0 | 2 | Rest | 10 |
| 14-19 | Your custom | 1 | 2 | Rest | 10 |
| 20-23 | Your custom | 1 | 3 | Rest | 10 |
| 24 | Your custom | 2 | 3 | Rest | 10 |

## 🌟 Special Features

1. **Auto-unlock**: Doors unlock automatically at midnight on their date
2. **One-time-only**: Each door can only be opened once (no peeking!)
3. **Today highlight**: Today's door pulses in gold
4. **Progress tracking**: See X/24 days completed
5. **Smooth animations**: Framer Motion for beautiful transitions
6. **Mobile-friendly**: Perfect on phones and tablets

## 💡 Pro Tips

1. **Tell a Story**: Make cards 1-24 tell a progressive story
2. **Mix Emotions**: Balance funny, sweet, and romantic cards
3. **Use Variety**: Different Pokemon types keep it interesting
4. **Save Best for Last**: Day 24 should blow them away
5. **Add Photos**: (Optional) Create custom card images in `public/custom-cards/`

## 🐛 Troubleshooting

### "Day X is not available yet"
- Normal! Doors unlock on their actual date
- For testing, you can temporarily modify date checks

### Cards not loading
- Check your Pokemon TCG API key in `.env.local`
- Verify card IDs at https://pokemontcg.io/
- Check browser console for errors

### Build errors
```bash
npm run build
```
- Fix any TypeScript errors shown
- Ensure all required fields in JSON are present

## 📱 Deployment

When ready to deploy:

```bash
# Build for production
npm run build

# Deploy to your hosting service
# (Vercel, Netlify, etc.)
```

The advent calendar will automatically work based on the actual date!

## 🎁 Final Checklist

- [ ] Customize all 5 example cards with your own messages
- [ ] Add 19 more cards (one for each remaining day)
- [ ] Make Day 24 extra special
- [ ] Test opening a few doors
- [ ] Test on mobile device
- [ ] Check all flavor text for typos
- [ ] Build and deploy before December 1st!

## ❤️ Making It Special

Remember:
- Be specific with memories ("Remember when we..." not "That time we...")
- Inside jokes are gold
- Mix humor and heart
- The personal touches matter most
- Have fun with it!

---

**Need more help?** Check [ADVENT_CALENDAR_GUIDE.md](./ADVENT_CALENDAR_GUIDE.md) for detailed documentation.

**Ready to customize?** Open `src/data/custom-cards/customCardDatabase.json` and start making it yours!

🎄✨ Happy customizing! ✨🎄
