/**
 * Haptic feedback utility for mobile devices
 * Uses Web Vibration API with fallback for unsupported devices
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticConfig {
  enabled: boolean;
}

class HapticManager {
  private config: HapticConfig = {
    enabled: true,
  };

  private patterns: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30],
  };

  constructor() {
    // Load preferences from localStorage
    this.loadPreferences();
  }

  /**
   * Check if Vibration API is supported
   */
  isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback
   */
  vibrate(pattern: HapticPattern | number | number[]): void {
    if (!this.config.enabled || !this.isSupported()) {
      return;
    }

    try {
      if (typeof pattern === 'string') {
        const hapticPattern = this.patterns[pattern];
        navigator.vibrate(hapticPattern);
      } else {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Enable haptic feedback
   */
  enable(): void {
    this.config.enabled = true;
    this.savePreferences();
  }

  /**
   * Disable haptic feedback
   */
  disable(): void {
    this.config.enabled = false;
    this.savePreferences();
  }

  /**
   * Toggle haptic feedback
   */
  toggle(): boolean {
    this.config.enabled = !this.config.enabled;
    this.savePreferences();
    return this.config.enabled;
  }

  /**
   * Check if haptic feedback is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Stop all vibrations
   */
  stop(): void {
    if (this.isSupported()) {
      navigator.vibrate(0);
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('haptic-preferences', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save haptic preferences:', error);
    }
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('haptic-preferences');
      if (stored) {
        this.config = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load haptic preferences:', error);
    }
  }
}

export const hapticManager = new HapticManager();
