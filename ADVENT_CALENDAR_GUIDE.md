# Pokemon Advent Calendar - Customization Guide

## Overview

The Pokemon Advent Calendar feature allows you to create a special Christmas experience with 24 days of custom Pokemon card packs. Each day from December 1-24 unlocks a new pack that can contain custom cards with personalized messages, memories, and inside jokes.

## Quick Start

### 1. View the Calendar

Click the "Advent" button in the navigation header to access the advent calendar view.

### 2. Open Daily Packs

- Each day unlocks automatically on its date (December 1-24)
- Today's door is highlighted in gold
- Click any available (unlocked) door to open that day's pack
- Each door can only be opened once

## Creating Custom Cards

### Location

All custom cards are defined in:
```
src/data/custom-cards/customCardDatabase.json
```

### Card Structure

```json
{
  "id": "custom-001",
  "baseCardId": "base1-58",
  "name": "First Date Pikachu",
  "nickname": "Sparky",
  "hp": "60",
  "type": "Electric",
  "rarity": "Rare Holo",
  "attacks": [
    {
      "name": "Cafe Spark",
      "damage": "30",
      "description": "Where it all began",
      "cost": ["Electric"]
    }
  ],
  "flavorText": "The coffee shop where our adventure started.",
  "assignedDay": 1,
  "category": "milestone"
}
```

### Fields Explained

- **id**: Unique identifier (e.g., `custom-001`, `custom-024`)
- **baseCardId**: Pokemon TCG API card ID to use as the base template
  - Find IDs at: https://pokemontcg.io/
  - Examples: `base1-58` (Pikachu), `base1-4` (Charizard)
- **name**: The custom name for your card
- **nickname**: Optional subtitle/nickname
- **hp**: Hit points (optional, uses base card if omitted)
- **type**: Pokemon type (Fire, Water, Electric, etc.)
- **rarity**: Card rarity (Common, Uncommon, Rare, Rare Holo, Secret Rare)
- **attacks**: Array of custom attacks with name, damage, and description
- **flavorText**: Personal message or memory at the bottom of the card
- **assignedDay**: Which day (1-24) this card appears
- **category**: Type of custom card (milestone, inside-joke, pet, holiday, location, ultra-rare)

## Card Categories

Use categories to organize your custom cards:

- **milestone**: Relationship milestones (first date, anniversary, etc.)
- **inside-joke**: Personal jokes only you two understand
- **pet**: Cards based on pets or favorite animals
- **holiday**: Christmas and holiday themed
- **location**: Special places you've been together
- **ultra-rare**: Extra special cards (like Day 24)

## Pack Distribution by Day

The system automatically adjusts pack contents based on the day:

### Days 1-13 (Early December)
- Custom cards for that day
- 2 uncommon cards
- Rest are common cards
- Total: 10 cards per pack

### Days 14-19 (Mid December)
- Custom cards for that day
- 1 rare card
- 2 uncommon cards
- Rest are common cards
- Total: 10 cards per pack

### Days 20-23 (Late December)
- Custom cards for that day
- 1 rare card
- 3 uncommon cards
- Rest are common cards
- Total: 10 cards per pack

### Day 24 (Christmas Eve)
- Custom cards for that day
- 2 rare cards
- 3 uncommon cards
- Rest are common cards
- Total: 10 cards per pack

## Finding Base Card IDs

1. Visit the Pokemon TCG API: https://pokemontcg.io/
2. Search for your desired Pokemon
3. Click on a card to see its details
4. Copy the card ID (e.g., `xy1-10`, `base1-4`)
5. Use this ID as the `baseCardId` in your custom card

Popular base cards:
- `base1-4` - Charizard
- `base1-7` - Squirtle
- `base1-58` - Pikachu
- `xy1-10` - Eevee
- `sm1-149` - Snorlax

## Example Custom Cards

### Relationship Milestone
```json
{
  "id": "custom-001",
  "baseCardId": "base1-58",
  "name": "First Date Pikachu",
  "flavorText": "Remember that coffee shop where we first met? ☕",
  "assignedDay": 1,
  "category": "milestone"
}
```

### Inside Joke
```json
{
  "id": "custom-005",
  "baseCardId": "sm1-149",
  "name": "Sleepy Snorlax",
  "flavorText": "Just like me on Sunday mornings! 😴",
  "assignedDay": 5,
  "category": "inside-joke"
}
```

### Christmas Special (Day 24)
```json
{
  "id": "custom-024",
  "baseCardId": "base1-4",
  "name": "Forever Charizard",
  "hp": "150",
  "rarity": "Secret Rare",
  "flavorText": "My love for you burns eternal. Merry Christmas! ❤️",
  "assignedDay": 24,
  "category": "ultra-rare"
}
```

## Adding Custom Images (Optional)

1. Create custom card images and save them in:
   ```
   public/custom-cards/
   ```

2. Reference them in your card JSON:
   ```json
   {
     "customImage": "christmas-charizard.png"
   }
   ```

3. The system will use this image instead of the base card image

## Tips for Great Custom Cards

1. **Personal Memories**: Use flavor text to reference specific memories
2. **Inside Jokes**: Include jokes or references only you two understand
3. **Progressive Story**: Build up to Day 24 with increasingly special cards
4. **Balance**: Mix funny, sweet, and heartfelt cards
5. **Variety**: Use different Pokemon types to keep it interesting

## Testing During Development

To test the calendar before December:

1. The calendar shows all 24 doors
2. During development, you can modify the date checks in `useAdventProgress.ts`
3. For production, doors automatically unlock on their respective dates

## Current Setup

The template includes 5 sample cards assigned to days 1, 2, 7, 14, and 24. You should:

1. Customize these cards with your own messages
2. Add 19 more cards for the remaining days
3. Ensure each day (1-24) has at least one custom card

## Resetting Progress

Progress is stored in localStorage with key `advent-calendar-2024`. To reset:
- Open browser DevTools (F12)
- Go to Application/Storage → Local Storage
- Delete the `advent-calendar-2024` key
- Or use the reset function in the browser console:
  ```javascript
  localStorage.removeItem('advent-calendar-2024')
  ```

## Troubleshooting

### Cards not loading
- Check the Pokemon TCG API key in `.env.local`
- Verify `baseCardId` values are valid
- Check browser console for errors

### Wrong day showing as available
- Check system date/time settings
- Verify date logic in `useAdventProgress.ts`

### Custom images not showing
- Ensure images are in `public/custom-cards/`
- Check file names match `customImage` field
- Verify image file extensions

## Need More Help?

- Pokemon TCG API Docs: https://docs.pokemontcg.io/
- Card Search: https://pokemontcg.io/
- Project README: [README.md](./README.md)

---

**Happy customizing! Make this advent calendar truly special! 🎄✨**
