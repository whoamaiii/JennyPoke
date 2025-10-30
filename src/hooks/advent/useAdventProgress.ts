import { useState, useEffect } from 'react';
import { AdventProgress, CardData } from '@/types/pokemon';
import { startOfDay, isAfter, isBefore, isSameDay } from 'date-fns';

const STORAGE_KEY = 'advent-calendar-2024';
const PACKS_STORAGE_KEY = 'advent-packs-2024';
const ADVENT_START = new Date(2024, 11, 1); // December 1, 2024
const ADVENT_END = new Date(2024, 11, 24); // December 24, 2024

interface SavedPacks {
  [day: number]: CardData[];
}

export const useAdventProgress = () => {
  const [progress, setProgress] = useState<AdventProgress>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that it's for the current year
        if (parsed.year === 2024) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading advent progress:', error);
    }

    // Default progress
    return {
      year: 2024,
      openedDays: [],
      lastOpened: undefined
    };
  });

  // Save to localStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving advent progress:', error);
    }
  }, [progress]);

  const markDayOpened = (day: number) => {
    if (!progress.openedDays.includes(day)) {
      setProgress(prev => ({
        ...prev,
        openedDays: [...prev.openedDays, day],
        lastOpened: new Date().toISOString()
      }));
    }
  };

  const isDayOpened = (day: number): boolean => {
    return progress.openedDays.includes(day);
  };

  const isDayAvailable = (day: number): boolean => {
    const today = startOfDay(new Date());
    const dayDate = new Date(2024, 11, day); // December of 2024

    // Day is available if:
    // 1. It's on or after the day's date
    // 2. It's within the advent period
    return !isAfter(dayDate, today) &&
           !isBefore(dayDate, ADVENT_START) &&
           !isAfter(dayDate, ADVENT_END);
  };

  const canOpenToday = (day: number): boolean => {
    const today = startOfDay(new Date());
    const dayDate = new Date(2024, 11, day);

    return isSameDay(dayDate, today) && !isDayOpened(day) && isDayAvailable(day);
  };

  const getCurrentDay = (): number | null => {
    const today = new Date();
    if (today.getMonth() === 11 && today.getDate() <= 24 && today.getFullYear() === 2024) {
      return today.getDate();
    }
    return null;
  };

  const resetProgress = () => {
    setProgress({
      year: 2024,
      openedDays: [],
      lastOpened: undefined
    });
    localStorage.removeItem(PACKS_STORAGE_KEY);
  };

  // Pack storage functions
  const savePackForDay = (day: number, pack: CardData[]) => {
    try {
      const stored = localStorage.getItem(PACKS_STORAGE_KEY);
      const packs: SavedPacks = stored ? JSON.parse(stored) : {};
      packs[day] = pack;
      localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(packs));
    } catch (error) {
      console.error('Error saving pack:', error);
    }
  };

  const getPackForDay = (day: number): CardData[] | null => {
    try {
      const stored = localStorage.getItem(PACKS_STORAGE_KEY);
      if (!stored) return null;
      const packs: SavedPacks = JSON.parse(stored);
      return packs[day] || null;
    } catch (error) {
      console.error('Error loading pack:', error);
      return null;
    }
  };

  const hasPackSaved = (day: number): boolean => {
    return getPackForDay(day) !== null;
  };

  return {
    progress,
    openedDays: progress.openedDays,
    markDayOpened,
    isDayOpened,
    isDayAvailable,
    canOpenToday,
    getCurrentDay,
    resetProgress,
    savePackForDay,
    getPackForDay,
    hasPackSaved
  };
};
