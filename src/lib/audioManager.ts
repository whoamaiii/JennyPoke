import { Howl, Howler } from 'howler';

export type SoundEffect =
  | 'pack-rustle'
  | 'pack-rip'
  | 'card-whoosh'
  | 'card-reveal'
  | 'rare-chime'
  | 'sparkle'
  | 'anticipation';

interface SoundConfig {
  src: string;
  volume?: number;
  loop?: boolean;
  sprite?: Record<string, [number, number]>;
}

class AudioManager {
  private sounds: Map<SoundEffect, Howl> = new Map();
  private _volume: number = 0.7;
  private _muted: boolean = false;
  private initialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadPreferences();
    }
  }

  /**
   * Initialize all sound effects
   */
  init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    const soundConfigs: Record<SoundEffect, SoundConfig> = {
      'pack-rustle': {
        src: '/sounds/pack-rustle.mp3',
        volume: 0.6,
        loop: true
      },
      'pack-rip': {
        src: '/sounds/pack-rip.mp3',
        volume: 0.8
      },
      'card-whoosh': {
        src: '/sounds/card-whoosh.mp3',
        volume: 0.5
      },
      'card-reveal': {
        src: '/sounds/card-reveal.mp3',
        volume: 0.6
      },
      'rare-chime': {
        src: '/sounds/rare-chime.mp3',
        volume: 0.7
      },
      'sparkle': {
        src: '/sounds/sparkle.mp3',
        volume: 0.4
      },
      'anticipation': {
        src: '/sounds/anticipation.mp3',
        volume: 0.5,
        loop: true
      }
    };

    // Create Howl instances for each sound
    Object.entries(soundConfigs).forEach(([key, config]) => {
      try {
        const sound = new Howl({
          src: [config.src],
          volume: (config.volume || 1) * this._volume,
          loop: config.loop || false,
          preload: true,
          html5: false, // Use Web Audio API for better performance
          onloaderror: (id, error) => {
            console.warn(`Failed to load sound: ${key}`, error);
          }
        });
        this.sounds.set(key as SoundEffect, sound);
      } catch (error) {
        console.error(`Error creating sound: ${key}`, error);
      }
    });

    this.initialized = true;
    this.applyMutedState();
  }

  /**
   * Play a sound effect
   */
  play(effect: SoundEffect): number | void {
    const sound = this.sounds.get(effect);
    if (!sound) {
      console.warn(`Sound effect not found: ${effect}`);
      return;
    }

    try {
      return sound.play();
    } catch (error) {
      console.error(`Error playing sound: ${effect}`, error);
    }
  }

  /**
   * Stop a sound effect
   */
  stop(effect: SoundEffect): void {
    const sound = this.sounds.get(effect);
    if (sound) {
      sound.stop();
    }
  }

  /**
   * Pause a sound effect
   */
  pause(effect: SoundEffect): void {
    const sound = this.sounds.get(effect);
    if (sound) {
      sound.pause();
    }
  }

  /**
   * Fade in a sound effect
   */
  fadeIn(effect: SoundEffect, duration: number = 1000): number | void {
    const sound = this.sounds.get(effect);
    if (!sound) return;

    const id = sound.play();
    if (typeof id === 'number') {
      sound.fade(0, (sound.volume() as number), duration, id);
    }
    return id;
  }

  /**
   * Fade out a sound effect
   */
  fadeOut(effect: SoundEffect, duration: number = 1000): void {
    const sound = this.sounds.get(effect);
    if (!sound) return;

    const currentVolume = sound.volume() as number;
    sound.fade(currentVolume, 0, duration);

    // Stop the sound after fade completes
    setTimeout(() => {
      sound.stop();
      sound.volume(currentVolume); // Reset volume for next play
    }, duration);
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));

    // Update all sounds
    this.sounds.forEach((sound) => {
      sound.volume(this._volume);
    });

    this.savePreferences();
  }

  /**
   * Get master volume
   */
  getVolume(): number {
    return this._volume;
  }

  /**
   * Mute all sounds
   */
  mute(): void {
    this._muted = true;
    Howler.mute(true);
    this.savePreferences();
  }

  /**
   * Unmute all sounds
   */
  unmute(): void {
    this._muted = false;
    Howler.mute(false);
    this.savePreferences();
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    if (this._muted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this._muted;
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this._muted;
  }

  /**
   * Stop all playing sounds
   */
  stopAll(): void {
    this.sounds.forEach((sound) => {
      sound.stop();
    });
  }

  /**
   * Unload all sounds
   */
  unload(): void {
    this.sounds.forEach((sound) => {
      sound.unload();
    });
    this.sounds.clear();
    this.initialized = false;
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('audio-preferences', JSON.stringify({
        volume: this._volume,
        muted: this._muted
      }));
    } catch (error) {
      console.error('Failed to save audio preferences:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem('audio-preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        this._volume = prefs.volume ?? 0.7;
        this._muted = prefs.muted ?? false;
      }
    } catch (error) {
      console.error('Failed to load audio preferences:', error);
    }
  }

  /**
   * Apply muted state to Howler
   */
  private applyMutedState(): void {
    Howler.mute(this._muted);
  }

  /**
   * Preload all sounds
   */
  preload(): Promise<void> {
    return new Promise((resolve) => {
      this.init();

      // Check if all sounds are loaded
      const checkLoaded = setInterval(() => {
        const allLoaded = Array.from(this.sounds.values()).every(
          sound => sound.state() === 'loaded'
        );

        if (allLoaded) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        resolve();
      }, 5000);
    });
  }

  /**
   * Pack opening sequence - orchestrates multiple sounds
   */
  playPackOpeningSequence(hasRare: boolean = false): void {
    // Anticipation phase (0-1.5s)
    this.fadeIn('anticipation', 500);

    setTimeout(() => {
      this.fadeOut('anticipation', 500);
    }, 1000);

    // Shake phase (1.5-2.7s)
    setTimeout(() => {
      this.play('pack-rustle');

      // Sparkles during shake
      const sparkleInterval = setInterval(() => {
        this.play('sparkle');
      }, 200);

      setTimeout(() => {
        clearInterval(sparkleInterval);
      }, 1200);
    }, 1500);

    // Burst phase (2.7-3.5s)
    setTimeout(() => {
      this.stop('pack-rustle');
      this.play('pack-rip');

      if (hasRare) {
        setTimeout(() => {
          this.play('rare-chime');
        }, 300);
      }
    }, 2700);

    // Card reveal phase (3.5s+)
    setTimeout(() => {
      this.play('card-whoosh');
    }, 3500);
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

// Auto-initialize on first import (with user interaction check)
if (typeof window !== 'undefined') {
  // Initialize on first user interaction
  const initAudio = () => {
    audioManager.init();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('touchstart', initAudio);
    document.removeEventListener('keydown', initAudio);
  };

  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { once: true });
  document.addEventListener('keydown', initAudio, { once: true });
}
