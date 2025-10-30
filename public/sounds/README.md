# Sound Effects for Pack Opening

This directory contains all sound effects used in the enhanced pack opening experience.

## Required Sound Files

The following sound files are needed for the full audio experience:

### 1. **pack-rustle.mp3**
- **Description**: Rustling/shaking sound of a card pack
- **Duration**: ~1-2 seconds (can loop)
- **Use**: Plays during the shake animation phase
- **Sources**:
  - Freesound.org: Search "paper rustle" or "card shuffle"
  - Pixabay: Search "paper crinkle"
  - Record your own: Shake an actual Pokemon card pack!

### 2. **pack-rip.mp3**
- **Description**: Tearing/opening sound effect
- **Duration**: ~0.5-1 second
- **Use**: Plays when the pack bursts open
- **Sources**:
  - Freesound.org: Search "paper tear" or "packaging open"
  - Pixabay: Search "rip" or "tear"

### 3. **card-whoosh.mp3**
- **Description**: Swoosh/flying sound for cards
- **Duration**: ~0.5 seconds
- **Use**: Plays as cards fly out from the pack
- **Sources**:
  - Freesound.org: Search "whoosh" or "swish"
  - Pixabay: Search "swoosh"

### 4. **card-reveal.mp3**
- **Description**: Card flip/reveal sound
- **Duration**: ~0.3-0.5 seconds
- **Use**: Plays when user taps to reveal a card
- **Sources**:
  - Freesound.org: Search "card flip" or "snap"
  - Pixabay: Search "flip"

### 5. **rare-chime.mp3**
- **Description**: Special chime/bell sound for rare cards
- **Duration**: ~1-2 seconds
- **Use**: Plays when opening a pack with rare cards
- **Sources**:
  - Freesound.org: Search "chime" or "magic sparkle"
  - Pixabay: Search "bell" or "shimmer"
  - Consider: Bright, magical, uplifting tones

### 6. **sparkle.mp3**
- **Description**: Light sparkle/twinkle sound
- **Duration**: ~0.2-0.3 seconds
- **Use**: Plays repeatedly during shake animation for rare packs
- **Sources**:
  - Freesound.org: Search "sparkle" or "twinkle"
  - Pixabay: Search "ding" or "chime"

### 7. **anticipation.mp3**
- **Description**: Soft ambient/building tension sound
- **Duration**: ~2-3 seconds (can loop)
- **Use**: Plays during the anticipation phase before opening
- **Sources**:
  - Freesound.org: Search "ambient loop" or "suspense"
  - Pixabay: Search "tension" or "buildup"

## Where to Find Free Sound Effects

### Recommended Free Sources:
1. **Freesound.org** (Creative Commons)
   - Requires attribution for some sounds
   - High quality community submissions
   - Filter by license for commercial use

2. **Pixabay** (Royalty-free)
   - No attribution required
   - Good selection of game sounds
   - Easy to use

3. **Zapsplat** (Free with attribution)
   - Massive library
   - High quality professional sounds
   - Free tier with credits

4. **BBC Sound Effects** (Personal use)
   - Professional quality
   - Limited to personal/educational use
   - Great for realistic sounds

5. **Create Your Own**
   - Record actual Pokemon card packs
   - Use Audacity (free) for editing
   - Adjust pitch/speed for variety

## File Format Requirements

- **Format**: MP3 (recommended) or OGG
- **Bit Rate**: 128-192 kbps (balance quality/file size)
- **Sample Rate**: 44.1 kHz
- **Channels**: Mono or Stereo
- **Max File Size**: ~100KB per file (keep load times fast)

## Adding Sounds

1. Download or create your sound files
2. Convert to MP3 if needed (use Audacity or online converter)
3. Name files exactly as listed above
4. Place in this `/public/sounds/` directory
5. Test in the app - sounds will auto-load

## Testing Without Sound Files

The app will work without sound files! The AudioManager includes:
- Error handling for missing files
- Console warnings (check browser dev tools)
- Graceful degradation (animations still play silently)

## Volume Levels

The AudioManager has preset volumes for each sound:
- pack-rustle: 60% volume
- pack-rip: 80% volume
- card-whoosh: 50% volume
- card-reveal: 60% volume
- rare-chime: 70% volume
- sparkle: 40% volume
- anticipation: 50% volume

These are multiplied by the master volume setting (default 70%).

## Tips for Best Results

### 1. **Normalize Audio**
- Use Audacity's "Normalize" effect
- Set to -3dB to prevent clipping
- Ensures consistent volume across all sounds

### 2. **Trim Silence**
- Remove dead space at start/end
- Makes sounds feel more responsive
- Reduces file size

### 3. **Compress for Web**
- Use MP3 encoding at 128-192 kbps
- Variable bit rate (VBR) for smaller files
- Test loading times on mobile

### 4. **Layer Sounds** (Optional)
- Combine multiple sounds in Audacity
- Add reverb to sparkle.mp3 for depth
- EQ adjustments for clarity

### 5. **Test on Different Devices**
- Mobile speakers (often limited bass)
- Headphones (full frequency range)
- Adjust volumes based on testing

## License Considerations

If distributing this app publicly, ensure:
- You have rights to use all sounds
- Attribution is provided if required
- Commercial use is allowed (if applicable)
- Keep licenses.txt with attribution info

## Example Attribution File

Create `public/sounds/licenses.txt`:

```
pack-rustle.mp3
- Source: Freesound.org
- Author: username
- License: CC BY 4.0
- URL: [link to sound]

pack-rip.mp3
- Source: Pixabay
- License: Pixabay License (no attribution required)
```

## Future Enhancements

Consider adding:
- Background music (loopable ambient track)
- UI interaction sounds (button clicks)
- Achievement unlocked sounds
- Different sounds per pack type
- Spatial audio effects (3D positioning)

## Need Help?

- Check browser console for audio errors
- Verify file paths are correct
- Test with one sound at a time
- Ensure files aren't corrupted
- Check file permissions

Happy sound hunting! 🎵
