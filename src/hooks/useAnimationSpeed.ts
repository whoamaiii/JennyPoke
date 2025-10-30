import { useState, useEffect } from 'react';
import { AnimationSpeed } from '@/components/EnhancedPackOpening';

const STORAGE_KEY = 'pack-animation-speed';
const DEFAULT_SPEED: AnimationSpeed = 'normal';

export const useAnimationSpeed = () => {
  const [speed, setSpeed] = useState<AnimationSpeed>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SPEED;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && ['fast', 'normal', 'cinematic'].includes(stored)) {
        return stored as AnimationSpeed;
      }
    } catch (error) {
      console.error('Failed to load animation speed preference:', error);
    }
    return DEFAULT_SPEED;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, speed);
    } catch (error) {
      console.error('Failed to save animation speed preference:', error);
    }
  }, [speed]);

  return [speed, setSpeed] as const;
};
