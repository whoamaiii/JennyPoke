import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VersionChecker } from "@/components/VersionChecker";
import { StorageCompatibilityCheck } from "@/components/StorageCompatibilityCheck";

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const Test = lazy(() => import("./pages/Test"));
const HolographicDemo = lazy(() => import("./pages/HolographicDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Card Preloader component - handles initializing IndexedDB and session cards
const CardPreloader = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize IndexedDB, migrate data, and download cards
    const initializeCards = async () => {
      setIsLoading(true);
      try {
        console.log('[CardPreloader] Starting initialization...');

        // Step 1: Initialize IndexedDB
        const { indexedDBManager } = await import('@/lib/indexedDBManager');
        await indexedDBManager.init();
        console.log('[CardPreloader] IndexedDB initialized');

        // Step 2: Run migration from sessionStorage if needed
        const { migrateToIndexedDB, isMigrationCompleted } = await import('@/lib/storageMigration');
        const migrated = await isMigrationCompleted();

        if (!migrated) {
          console.log('[CardPreloader] Running migration from sessionStorage to IndexedDB...');
          toast.info('Upgrading storage system...');
          const migrationResult = await migrateToIndexedDB();
          if (migrationResult.success && migrationResult.migratedCards > 0) {
            console.log(`[CardPreloader] Migrated ${migrationResult.migratedCards} cards successfully`);
            toast.success(`Upgraded! ${migrationResult.migratedCards} cards migrated to new storage.`);
          }
        } else {
          console.log('[CardPreloader] Migration already completed');
        }

        // Step 2.5: Warm up sessionStorage cache from IndexedDB
        const { warmupCache } = await import('@/lib/cardStorageBridge');
        const cachedCount = await warmupCache();
        if (cachedCount > 0) {
          console.log(`[CardPreloader] Warmed up cache with ${cachedCount} cards`);
        }

        // Step 3: Initialize session card manager
        const { initializeSessionCards, getSessionStats, refreshSessionCards } = await import('@/services/sessionCardManager');

        // Check if we have cards already
        const stats = getSessionStats();
        console.log('[CardPreloader] Current stats:', stats);

        // Only download if we have NO cards at all (first time use)
        if (stats.totalCards === 0) {
          console.log('[CardPreloader] First time use - downloading initial cards...');
          toast.info('First time setup: Downloading cards...', { duration: 5000 });

          try {
            const success = await refreshSessionCards(true); // Initial load
            if (success) {
              const updatedStats = getSessionStats();
              console.log('[CardPreloader] Initial download complete:', updatedStats);
              toast.success(`${updatedStats.totalCards} cards downloaded! Ready to play!`);
            } else {
              toast.warning('Download incomplete, but you can still try opening packs.');
            }
          } catch (err) {
            console.error('[CardPreloader] Error downloading cards:', err);
            toast.warning('Download had issues, but pack opening may still work.');
          }
        } else if (stats.availableCards < 16) {
          // Have some cards, but running low - download more in BACKGROUND
          console.log(`[CardPreloader] Running low on cards (${stats.availableCards} available) - downloading more in background...`);

          // Don't await - let it run in background
          refreshSessionCards().then(() => {
            const updatedStats = getSessionStats();
            console.log('[CardPreloader] Background download complete:', updatedStats);
          }).catch(err => {
            console.warn('[CardPreloader] Background download failed:', err);
          });

          // Show ready message immediately
          toast.success(`${stats.availableCards} cards ready! More downloading in background...`);
        } else {
          console.log(`[CardPreloader] Already have ${stats.availableCards} cards available - ready to play!`);
          toast.success(`${stats.availableCards} cards ready to use!`, { duration: 2000 });
        }

        // Step 4: Check storage quota
        const storageEstimate = await indexedDBManager.estimateStorage();
        if (storageEstimate) {
          console.log(`[CardPreloader] Storage: ${(storageEstimate.usage / 1024 / 1024).toFixed(2)}MB / ${(storageEstimate.quota / 1024 / 1024).toFixed(2)}MB`);
        }
      } catch (error) {
        console.error('[CardPreloader] Initialization failed:', error);
        toast.error('Failed to initialize app. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    // Run immediately - no delay needed
    const timer = setTimeout(() => {
      initializeCards();
    }, 100); // Minimal delay just to let UI render

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything visible
};

const queryClient = new QueryClient();

// Service Worker Registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Service Worker registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              toast.info('New version available! Refresh to update.');
            }
          });
        }
      });
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  }
};

const App = () => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* Card preloader runs as soon as the app mounts */}
              <CardPreloader />
              {/* Version checker monitors for app updates */}
              <VersionChecker />
              {/* Storage compatibility checker */}
              <StorageCompatibilityCheck />
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/test" element={<Test />} />
                  <Route path="/holo-demo" element={<HolographicDemo />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
