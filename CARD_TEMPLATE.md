# Custom Card Templates

Quick templates to help you create your 24 custom cards!

## Simple Template (Most Common)

```json
{
  "id": "custom-XXX",
  "baseCardId": "POKEMON-ID",
  "name": "Custom Name",
  "flavorText": "Your personal message here",
  "assignedDay": X,
  "category": "milestone"
}
```

## Full Template (For Special Cards)

```json
{
  "id": "custom-XXX",
  "baseCardId": "POKEMON-ID",
  "name": "Custom Name",
  "nickname": "Optional Subtitle",
  "hp": "100",
  "type": "Fire",
  "rarity": "Rare Holo",
  "attacks": [
    {
      "name": "Attack Name",
      "damage": "50",
      "description": "What this attack does",
      "cost": ["Fire"]
    },
    {
      "name": "Second Attack",
      "damage": "100",
      "description": "Powerful attack",
      "cost": ["Fire", "Fire", "Colorless"]
    }
  ],
  "flavorText": "Your personal message",
  "assignedDay": X,
  "category": "ultra-rare"
}
```

## Popular Base Card IDs

### Starters
- `base1-7` - Squirtle
- `base1-46` - Charmander
- `base1-44` - Bulbasaur

### Classics
- `base1-4` - Charizard (rare/powerful)
- `base1-58` - Pikachu (iconic)
- `xy1-10` - Eevee (cute)
- `sm1-149` - Snorlax (funny)

### Cute/Sweet
- `xy5-1` - Jigglypuff
- `base1-39` - Clefairy
- `base1-53` - Meowth

### Cool/Strong
- `base1-9` - Blastoise
- `base1-2` - Venusaur
- `base1-8` - Gyarados

### Legendary
- `base1-10` - Mewtwo
- `base1-15` - Zapdos
- `base1-12` - Ninetales

## 24-Day Story Arc Ideas

### Week 1 (Days 1-7): "The Beginning"
- Day 1: How you met
- Day 2: First conversation
- Day 3: First date
- Day 4: First inside joke
- Day 5: When you knew they were special
- Day 6: First adventure together
- Day 7: A funny early memory

### Week 2 (Days 8-14): "Growing Together"
- Day 8: A challenge you overcame
- Day 9: A favorite shared hobby
- Day 10: A silly habit of theirs you love
- Day 11: A place that's special to you both
- Day 12: A song that's "your song"
- Day 13: A meal you love sharing
- Day 14: Why you're grateful for them

### Week 3 (Days 15-21): "The Journey"
- Day 15: A trip you took together
- Day 16: A dream you share
- Day 17: Something they taught you
- Day 18: A pet or animal memory
- Day 19: A holiday tradition
- Day 20: Something they do that makes you smile
- Day 21: A promise you made

### Final Days (22-24): "Forever"
- Day 22: What makes them unique
- Day 23: Your favorite thing about them
- Day 24: Your Christmas message / future together

## Categories Explained

### milestone
First date, anniversary, moving in together, adopting a pet, proposals, etc.

### inside-joke
That thing that happened, the nickname, the funny story only you two know

### pet
Memories with pets, pet personalities as Pokemon

### holiday
Christmas memories, winter activities, holiday traditions

### location
Special places: restaurants, parks, cities, vacation spots

### ultra-rare
The most special cards (save for key moments)

## Writing Great Flavor Text

### Good Examples
✅ "Remember when we got lost in the rain and found that tiny café? Best mistake ever."
✅ "You make terrible pancakes but I love them anyway 🥞"
✅ "That time you sang karaoke off-key - I fell even harder for you."
✅ "Every adventure is better with you by my side."

### Avoid
❌ "We had fun" (too generic)
❌ "You're nice" (too basic)
❌ "That was cool" (no specific memory)

### Tips
- Be specific! Mention actual events, places, or things
- Use their sense of humor
- Reference inside jokes
- Mix sweet and funny
- Don't be afraid to be cheesy on Day 24

## Example Card Set (Days 1-7)

```json
{
  "id": "custom-001",
  "baseCardId": "base1-58",
  "name": "First Date Pikachu",
  "flavorText": "Coffee shop on 5th St. You ordered a latte with way too much sugar. I knew then.",
  "assignedDay": 1,
  "category": "milestone"
},
{
  "id": "custom-002",
  "baseCardId": "base1-39",
  "name": "Stargazing Clefairy",
  "flavorText": "That night on the hill when you pointed out constellations. You made them all up.",
  "assignedDay": 2,
  "category": "location"
},
{
  "id": "custom-003",
  "baseCardId": "base1-7",
  "name": "Beach Day Squirtle",
  "flavorText": "You got sunburned. I told you to use sunscreen. You're stubborn. I love it.",
  "assignedDay": 3,
  "category": "inside-joke"
},
{
  "id": "custom-004",
  "baseCardId": "sm1-149",
  "name": "Sunday Morning Snorlax",
  "flavorText": "How you look on Sunday mornings: adorable, sleepy, refusing to move. Perfect.",
  "assignedDay": 4,
  "category": "inside-joke"
},
{
  "id": "custom-005",
  "baseCardId": "xy1-10",
  "name": "Road Trip Eevee",
  "flavorText": "2,000 miles, 47 songs on repeat, 1 incredible adventure. Let's do it again.",
  "assignedDay": 5,
  "category": "milestone"
},
{
  "id": "custom-006",
  "baseCardId": "base1-53",
  "name": "Karaoke Meowth",
  "flavorText": "You butchered that song. Everyone knew. You didn't care. I loved you more.",
  "assignedDay": 6,
  "category": "inside-joke"
},
{
  "id": "custom-007",
  "baseCardId": "base1-44",
  "name": "Garden Bulbasaur",
  "flavorText": "Remember trying to grow tomatoes? They died. But we had fun trying together.",
  "assignedDay": 7,
  "category": "location"
}
```

## Quick Copy-Paste Template

```json
{
  "id": "custom-XXX",
  "baseCardId": "",
  "name": "",
  "flavorText": "",
  "assignedDay": X,
  "category": "milestone"
},
```

Replace XXX and X, fill in the blanks, and you're done!

## Need Pokemon Inspiration?

Think about:
- Their favorite Pokemon
- Pokemon that match their personality
- Pokemon from games/shows you've watched together
- Pokemon that match the memory (water Pokemon for beach, etc.)
- Cute vs cool vs funny - what fits the moment?

---

**Ready to create?** Open `src/data/custom-cards/customCardDatabase.json` and start building your story!

**Need ideas?** Think about:
1. Your first year together
2. Funny moments that still make you laugh
3. Challenges you overcame together
4. Places that mean something to you both
5. Why you love them

🎄 Make it personal, make it fun, make it yours! ✨
