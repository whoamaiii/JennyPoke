/**
 * Dev Mode utilities for testing holographic effects
 * Guarantees holo cards in every pack when enabled
 */

const DEV_MODE_KEY = 'pokemon-dev-mode-holo';

export const isDevModeEnabled = (): boolean => {
  try {
    return localStorage.getItem(DEV_MODE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const enableDevMode = (): void => {
  try {
    localStorage.setItem(DEV_MODE_KEY, 'true');
    console.log('🔧 Dev Mode ENABLED - All packs will contain holo cards');
  } catch (e) {
    console.error('Failed to enable dev mode:', e);
  }
};

export const disableDevMode = (): void => {
  try {
    localStorage.removeItem(DEV_MODE_KEY);
    console.log('✅ Dev Mode DISABLED - Normal pack distribution');
  } catch (e) {
    console.error('Failed to disable dev mode:', e);
  }
};

export const toggleDevMode = (): boolean => {
  const newState = !isDevModeEnabled();
  if (newState) {
    enableDevMode();
  } else {
    disableDevMode();
  }
  return newState;
};
