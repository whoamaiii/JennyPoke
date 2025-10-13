import React from 'react';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { CardData } from '@/types/pokemon';
import { openPack, testApiKey } from '@/services/pokemonTcgApi';
import { Button } from '@/components/ui/button';
import { CardViewer } from '@/components/CardViewer';
import { PackOpening } from '@/components/PackOpening';
import { Sparkles, Heart } from 'lucide-react';
import { toast } from 'sonner';
import gsap from 'gsap';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import pokeballSvg from '@/assets/pokeball.svg';
import { PokemonTCGError } from '@/services/pokemonTcgApi';

// Lazy load the Dashboard component since it's only used occasionally
const Dashboard = lazy(() => import('@/components/Dashboard').then(module => ({ default: module.Dashboard })));

// Storage Status Component
const StorageStatus = () => {
  const [storageInfo, setStorageInfo] = useState<{ isAtCapacity: boolean; message: string }>({
    isAtCapacity: false,
    message: 'Loading...'
  });

  useEffect(() => {
    const updateStorageInfo = async () => {
      try {
        const { checkCapacityLimit } = await import('@/services/sessionCardManager');
        const info = checkCapacityLimit();
        setStorageInfo(info);
      } catch (error) {
        console.error('Error checking storage capacity:', error);
        setStorageInfo({
          isAtCapacity: false,
          message: 'Storage status unavailable'
        });
      }
    };

    updateStorageInfo();
    // Update every 5 seconds
    const interval = setInterval(updateStorageInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`text-center ${storageInfo.isAtCapacity ? 'text-orange-500' : 'text-muted-foreground'}`}>
      {storageInfo.message}
    </div>
  );
};

type View = 'home' | 'opening' | 'viewing' | 'completed' | 'dashboard';

const Index = () => {
  const [view, setView] = useState<View>('home');
  const [currentPack, setCurrentPack] = useSessionStorage<CardData[]>('currentPack', []);
  const [favorites, setFavorites] = useSessionStorage<CardData[]>('favorites', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PokemonTCGError | null>(null);
  const viewRootRef = useRef<HTMLDivElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isInitialDownloadComplete, setIsInitialDownloadComplete] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

  useEffect(() => {
    if (!viewRootRef.current) return;
    gsap.fromTo(
      viewRootRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
    );
  }, [view]);

  // Cancel ongoing requests when navigating away from home
  useEffect(() => {
    if (view !== 'home' && abortController) {
      console.log('🚫 Cancelling ongoing pack opening request due to navigation');
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setError(null);
    }
  }, [view, abortController]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        console.log('🚫 Cancelling ongoing pack opening request due to component unmount');
        abortController.abort();
      }
    };
  }, [abortController]);

  // Check initial download status on mount
  useEffect(() => {
    const checkInitialDownloadStatus = async () => {
      try {
        const { getSessionStats } = await import('@/services/sessionCardManager');
        const stats = getSessionStats();
        
        // If we have cards available, initial download is complete
        if (stats.totalCards > 0) {
          setIsInitialDownloadComplete(true);
          console.log('[Index] Initial download already complete, cards available:', stats.totalCards);
        } else {
          // Wait for the CardPreloader to complete its download
          console.log('[Index] Waiting for initial download to complete...');
          toast.info('Preparing cards for offline play...');
          
          // Check periodically until cards are available
          const checkInterval = setInterval(async () => {
            const currentStats = getSessionStats();
            if (currentStats.totalCards > 0) {
              setIsInitialDownloadComplete(true);
              clearInterval(checkInterval);
              console.log('[Index] Initial download completed, cards available:', currentStats.totalCards);
              toast.success('Cards ready! You can now open packs.');
            }
          }, 1000);
          
          // Clear interval after 30 seconds to avoid infinite checking
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!isInitialDownloadComplete) {
              console.warn('[Index] Initial download timeout, allowing pack opening anyway');
              setIsInitialDownloadComplete(true);
            }
          }, 30000);
        }
      } catch (error) {
        console.error('[Index] Error checking initial download status:', error);
        // Allow pack opening even if check fails
        setIsInitialDownloadComplete(true);
      }
    };
    
    checkInitialDownloadStatus();
  }, []);

  const handleOpenPack = async () => {
    if (isLoading || isTestingApi || !isInitialDownloadComplete) return; // prevent multiple clicks and simultaneous operations
    
    setIsLoading(true);
    setError(null); // Clear any previous errors
    toast.info('Fetching cards from API...');

    console.log('🎯 Starting pack opening process...');
    const startTime = Date.now();

    try {
      // Import sessionCardManager dynamically to avoid issues with SSR
      const { 
        getRandomPack, 
        convertSessionCardToCardData, 
        markCardsAsShown,
        checkNeedRefresh,
        refreshSessionCards,
        getSessionStats,
        checkCapacityLimit
      } = await import('@/services/sessionCardManager');
      
      // Check capacity limit before opening pack
      const capacityCheck = checkCapacityLimit();
      if (capacityCheck.isAtCapacity) {
        toast.error(capacityCheck.message, {
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }
      
      // Check if we have cards available
      const stats = getSessionStats();
      console.log(`[Index] Opening pack, session has ${stats.totalCards} total cards, ${stats.availableCards} available`);
      
      // If no cards at all, start downloading and show appropriate feedback
      if (stats.totalCards === 0) {
        console.log('[Index] No cards in session, initiating download');
        toast.info('No cards loaded yet. Downloading cards now...');
        
        // Try to download cards and check if we got any
        const downloadSuccess = await refreshSessionCards();
        if (!downloadSuccess) {
          console.error('[Index] Initial card download failed');
          throw new PokemonTCGError('Failed to download cards. Please check your network connection and try again.', 'NO_DATA');
        }
        
        // Check if we have cards after download
        const updatedStats = getSessionStats();
        if (updatedStats.totalCards === 0) {
          console.error('[Index] No cards available after download attempt');
          throw new PokemonTCGError('No cards available after download. Please try again later.', 'NO_DATA');
        }
      }
      
      // Get cards from session storage instead of API
      console.log('[Index] Requesting random pack from session storage');
      const { cards: sessionCards, needsRefresh } = getRandomPack();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Index] Got ${sessionCards.length} cards from session in ${duration}s`);
      
      if (sessionCards.length === 0) {
        console.error('[Index] No session cards returned from getRandomPack');
        
        // If cards are still downloading, provide clearer feedback
        if (stats.isLoading) {
          console.log('[Index] Cards are still loading, asking user to wait');
          toast.info('Cards are still downloading. Please try again in a few moments.');
          throw new PokemonTCGError('Cards are being downloaded. Please wait a moment and try again.', 'NO_DATA');
        } else {
          // If not loading but no cards, force a refresh and provide clear guidance
          console.log('[Index] No cards and not loading, forcing refresh');
          toast.info('No cards available. Downloading new cards now...');
          
          const refreshSuccess = await refreshSessionCards();
          if (refreshSuccess) {
            toast.success('Cards downloaded! Try opening a pack now.');
          }
          
          throw new PokemonTCGError('Cards are being downloaded. Please try opening a pack again.', 'NO_DATA');
        }
      }
      
      console.log(`[Index] Successfully retrieved ${sessionCards.length} cards for pack`);
      
      
      // Convert session cards to card data format
      const cards = convertSessionCardToCardData(sessionCards);
      console.log(`✅ Pack opened from session in ${duration}s with ${cards.length} cards`);
      
      // Mark these cards as shown
      markCardsAsShown(sessionCards.map(card => card.id));
      
      // Trigger background refresh if needed
      if (needsRefresh && !isTestingApi) {
        console.log('🔄 Background refresh triggered - downloading more cards');
        toast.info('Downloading more cards in background...');
        setIsBackgroundLoading(true);
        refreshSessionCards()
          .then(() => {
            console.log('✅ Background refresh completed');
            toast.success('More cards downloaded successfully!');
          })
          .catch(err => {
            console.error('Background card refresh failed:', err);
            toast.error('Background download failed, but you can still open packs');
          })
          .finally(() => {
            setIsBackgroundLoading(false);
          });
      }
      
      setCurrentPack(cards);
      setView('opening');
      toast.success('Pack opened! Swipe through your cards!');
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`❌ Pack opening failed after ${duration}s:`, error);

      // Create standardized error
      const pokemonError = error instanceof PokemonTCGError ? error :
        new PokemonTCGError('An unexpected error occurred. Please try again.', 'UNKNOWN', error);

      setError(pokemonError);

      // Show appropriate toast message based on error type
      switch (pokemonError.code) {
        case 'NO_DATA':
          toast.error('No cards available right now. Still downloading cards - please try again in a moment.');
          
          // Try to refresh cards in background
          try {
            const { refreshSessionCards } = await import('@/services/sessionCardManager');
            refreshSessionCards();
          } catch (refreshError) {
            console.error('Failed to trigger background refresh:', refreshError);
          }
          break;
        default:
          toast.error('Something went wrong loading cards. Please try again.');
      }

      console.error('Pack opening error:', pokemonError);
    } finally {
      setIsLoading(false);
      setAbortController(null); // Clean up abort controller even though we're not using it
    }
  };

  const handleRetry = () => {
    handleOpenPack();
  };

  const handleSwipe = async (cardId: string, favorite: boolean) => {
    if (favorite) {
      const card = currentPack.find((c) => c.id === cardId);
      if (card) {
        setFavorites([...favorites, card]);
        toast.success(`Added ${card.card.name} to favorites!`, {
          icon: <Heart className="w-4 h-4" fill="currentColor" />,
        });
      }
    } else {
      // Card was dismissed - remove it from session storage immediately
      try {
        const { removeCardsFromSession } = await import('@/services/sessionCardManager');
        removeCardsFromSession([cardId]);
        console.log(`[Index] Removed dismissed card ${cardId} from session storage`);
      } catch (error) {
        console.error('[Index] Error removing dismissed card from session storage:', error);
      }
    }
  };

  const handleViewingComplete = () => {
    setCurrentPack([]);
    setView('completed');
  };

  const handleRemoveFavorite = (cardId: string) => {
    const card = favorites.find((c) => c.id === cardId);
    setFavorites(favorites.filter((c) => c.id !== cardId));
    if (card) {
      toast.info(`Removed ${card.card.name} from favorites`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={pokeballSvg} alt="Pokéball" className="w-6 h-6" />
            <h1 className="text-2xl font-bold hidden lg:block">Pokémon Pack Opener</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setView('home')}
              disabled={view === 'home'}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView('dashboard')}
              disabled={view === 'dashboard'}
            >
              Faves ({favorites.length})
            </Button>
            <Button variant="ghost" onClick={() => setHelpOpen(true)}>
              Help
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {/* view transition wrapper */}
        <div id="view-root" ref={viewRootRef} className="w-full max-w-4xl">
          {view === 'home' && (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
              <div className="mb-8">
                <img src={pokeballSvg} alt="Pokéball" className="w-28 h-28 mb-4 mx-auto" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Open Your Pokémon Pack
              </h2>
              
              <Button
                onClick={handleOpenPack}
                disabled={isLoading || isTestingApi || !isInitialDownloadComplete || isBackgroundLoading}
                variant="hero"
                size="lg"
                className="text-lg px-8 py-6"
                aria-label={!isInitialDownloadComplete ? "Preparing cards for pack opening" : isLoading ? "Opening pack, please wait" : "Open a new Pokémon card pack"}
              >
                {!isInitialDownloadComplete ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Preparing Cards...
                  </>
                ) : isLoading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Opening Pack...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Open Pack
                  </>
                )}
              </Button>

              {/* Storage Status Indicator */}
              <div className="mt-4 text-sm text-muted-foreground">
                <StorageStatus />
              </div>

              <Button
                onClick={async () => {
                  if (isTestingApi || isLoading || !isInitialDownloadComplete || isBackgroundLoading) return; // prevent multiple clicks and simultaneous operations
                  setIsTestingApi(true);
                  toast.info('Testing API key...');
                  try {
                    const success = await testApiKey();
                    if (success) {
                      toast.success('API key is working correctly!');
                    } else {
                      toast.error('API key test failed. Please check your configuration.');
                    }
                  } catch (error) {
                    toast.error('API key test failed. Please check your configuration.');
                  } finally {
                    setIsTestingApi(false);
                  }
                }}
                disabled={isTestingApi || isLoading || !isInitialDownloadComplete || isBackgroundLoading}
                variant="outline"
                size="sm"
                className="mt-4 text-sm"
                aria-label={!isInitialDownloadComplete ? "Preparing cards, API test unavailable" : isTestingApi ? "Testing API key, please wait" : "Test API key connection"}
              >
                {!isInitialDownloadComplete ? 'Preparing...' : isTestingApi ? 'Testing...' : 'Test API Key'}
              </Button>


              {error && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleRetry}
                    disabled={isLoading || isTestingApi || !isInitialDownloadComplete || isBackgroundLoading}
                    variant="outline"
                    size="sm"
                  >
                    {!isInitialDownloadComplete ? 'Preparing...' : isLoading ? 'Retrying...' : 'Try Again'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {view === 'opening' && (
            <PackOpening onComplete={() => setView('viewing')} />
          )}

          {view === 'viewing' && currentPack.length > 0 && (
            <div className="w-full">
              <CardViewer
                cards={currentPack}
                onSwipe={handleSwipe}
                onComplete={handleViewingComplete}
              />
            </div>
          )}

          {view === 'completed' && (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-fade-in">
              <div className="mb-8 animate-scale-in">
                <Sparkles className="w-24 h-24 text-pokemon-yellow mx-auto mb-4 animate-pulse" />
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pokemon-yellow to-pokemon-blue bg-clip-text text-transparent">
                Pack Complete!
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-md">
                You've gone through all the cards in this pack. Ready for more?
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => {
                    // Reset state and open new pack
                    setCurrentPack([]);
                    setError(null);
                    handleOpenPack();
                  }}
                  disabled={isLoading}
                  variant="hero"
                  size="lg"
                  className="text-lg px-8 py-6 h-auto"
                >
                  <Sparkles className="mr-2 w-6 h-6" />
                  {isLoading ? 'Opening...' : 'Open Another Pack'}
                </Button>
                <Button
                  onClick={() => setView('dashboard')}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 h-auto"
                >
                  <Heart className="mr-2 w-6 h-6" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}

          {view === 'dashboard' && (
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              </div>
            }>
              <Dashboard
                favorites={favorites}
                onRemoveFavorite={handleRemoveFavorite}
                onBackToHome={() => setView('home')}
              />
            </Suspense>
          )}
        </div>
        
        {/* Help modal (controlled) */}
        <Dialog open={helpOpen} onOpenChange={(isOpen) => setHelpOpen(isOpen)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to use</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <ul className="list-disc ml-6">
                <li>Swipe right (→) to skip</li>
                <li>Swipe left (←) to add to favorites</li>
                <li>Press Arrow keys for keyboard navigation</li>
              </ul>
            </DialogDescription>
            <DialogFooter>
              <Button onClick={() => setHelpOpen(false)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Index;
