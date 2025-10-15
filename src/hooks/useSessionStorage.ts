import { useState, useEffect } from 'react';
import { universalStorage } from '@/lib/storageManager';

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = universalStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('[useSessionStorage] Error reading initial value:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const success = universalStorage.setItem(key, JSON.stringify(valueToStore));
      
      if (!success) {
        console.warn('[useSessionStorage] Storage may be limited, using fallback');
      }
    } catch (error) {
      console.error('[useSessionStorage] Error setting value:', error);
    }
  };

  return [storedValue, setValue] as const;
}
