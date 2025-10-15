import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const APP_VERSION = '1.0.0'; // Should match meta.json
const VERSION_CHECK_KEY = 'app_version_checked';

export const VersionChecker = () => {
  const location = useLocation();
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef(false);

  const checkVersion = async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) return;
    
    // Don't check more than once per minute
    const now = Date.now();
    if (now - lastCheckRef.current < 60000) return;
    
    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      // Fetch meta.json with cache-busting timestamp
      const response = await fetch(`/meta.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.warn('[VersionChecker] Could not fetch meta.json');
        return;
      }

      const data = await response.json();
      const serverVersion = data.version;

      console.log('[VersionChecker] Current version:', APP_VERSION, 'Server version:', serverVersion);

      // Compare versions
      if (serverVersion !== APP_VERSION) {
        console.log('[VersionChecker] Version mismatch detected, reloading...');
        
        // Show user-friendly notification
        toast.info('New version available! Updating...', {
          duration: 2000,
        });

        // Wait a moment for the toast to show, then reload
        setTimeout(() => {
          // Force full page reload, bypassing cache
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('[VersionChecker] Error checking version:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // Check on route changes
  useEffect(() => {
    checkVersion();
  }, [location.pathname]);

  // Check when page becomes visible again (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkVersion();
  }, []);

  return null;
};
