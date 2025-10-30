import React from 'react';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { CardData } from '@/types/pokemon';
import { openPack } from '@/services/pokemonTcgApi';
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
const StorageStatus = ({ savedCardsCount }: { savedCardsCount: number }) => {
  const remainingSlots = 32 - savedCardsCount;
  const canOpen = remainingSlots >= 8;

  return (
    <div className="text-center space-y-1">
      <div className={`text-sm ${!canOpen ? 'text-red-500' : 'text-muted-foreground'}`}>
        Saved: {savedCardsCount}/32 cards
      </div>
      {!canOpen && (
        <div className="text-xs text-red-500">
          Remove {8 - remainingSlots} cards to open pack
        </div>
      )}
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
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Simple initialization on mount
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const { initializeSessionCards, getSessionStats } = await import('@/services/sessionCardManager');

        // Start initialization (downloads cards if needed)
        await initializeSessionCards();

        if (isMounted) {
          const stats = getSessionStats();
          console.log('[Index] Initialized with', stats.totalCards, 'cards');
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('[Index] Error during initialization:', error);
        // Allow pack opening even if initialization fails
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenPack = async () => {
    // Only prevent multiple simultaneous pack openings
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

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
        canOpenPack,
        shouldDownloadMoreCards
      } = await import('@/services/sessionCardManager');
      
      // Check if user can open a pack based on their saved cards
      const packCheck = canOpenPack(favorites.length);
      console.log(`[Index] Pack check: ${packCheck.message}`);
      if (!packCheck.canOpen) {
        toast.error(packCheck.message, {
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }
      
      // Check if we need to download more cards for session storage
      const downloadCheck = shouldDownloadMoreCards(favorites.length);
      console.log(`[Index] Download check: ${downloadCheck.reason}`);
      if (downloadCheck.shouldDownload) {
        toast.info('Downloading more cards in background...');
        refreshSessionCards();
      }
      
      // Check if we have cards available
      const stats = getSessionStats();
      console.log(`[Index] Opening pack, session has ${stats.totalCards} total cards, ${stats.availableCards} available`);
      
      // Get cards from session storage
      console.log('[Index] Requesting random pack from session storage');
      const { cards: sessionCards, needsRefresh } = getRandomPack();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Index] Got ${sessionCards.length} cards from session in ${duration}s`);

      // If no cards available, trigger download and ask user to try again
      if (sessionCards.length === 0) {
        console.log('[Index] No cards available, starting download');
        refreshSessionCards().catch(err => console.error('Download failed:', err));
        throw new PokemonTCGError('Downloading cards now. Please try again in a moment.', 'NO_DATA');
      }

      console.log(`[Index] Successfully retrieved ${sessionCards.length} cards for pack`);
      
      
      // Convert session cards to card data format
      const cards = convertSessionCardToCardData(sessionCards);
      console.log(`✅ Pack opened from session in ${duration}s with ${cards.length} cards`);
      
      // Mark these cards as shown
      markCardsAsShown(sessionCards.map(card => card.id));
      
      // Trigger background refresh if needed (non-blocking)
      if (needsRefresh) {
        console.log('🔄 Background refresh triggered - downloading more cards');
        refreshSessionCards()
          .then(() => {
            console.log('✅ Background refresh completed');
          })
          .catch(err => {
            console.error('Background card refresh failed:', err);
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
      toast.error(pokemonError.message);
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleRetry = () => {
    handleOpenPack();
  };

  const handleSwipe = async (cardId: string, favorite: boolean) => {
    if (favorite) {
      // Check if adding this card would exceed the 32 card limit
      if (favorites.length >= 32) {
        toast.error('Cannot add more cards. You have reached the 32 card limit. Remove some cards from favorites to add new ones.', {
          duration: 5000,
        });
        return;
      }
      
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
        const { removeCardsFromSession, shouldDownloadMoreCards, refreshSessionCards } = await import('@/services/sessionCardManager');
        removeCardsFromSession([cardId]);
        console.log(`[Index] Removed dismissed card ${cardId} from session storage`);
        
        // Check if we need to download more cards after dismissing
        const downloadCheck = shouldDownloadMoreCards(favorites.length);
        console.log(`[Index] After dismissing card - ${downloadCheck.reason}`);
        if (downloadCheck.shouldDownload) {
          toast.info('Downloading more cards in background...');
          refreshSessionCards();
        }
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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40 flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={pokeballSvg} alt="Pokéball" className="w-6 h-6" />
            <h1 className="text-2xl font-bold hidden lg:block">Pokémon Packs Opener</h1>
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
      <main className={`flex-1 ${view === 'dashboard' ? 'overflow-hidden' : 'flex items-center justify-center px-4 py-8'} min-h-0`}>
        {/* view transition wrapper */}
        <div id="view-root" ref={viewRootRef} className={`w-full ${view === 'dashboard' ? 'h-full' : 'max-w-4xl flex items-center justify-center'}`}>
          {view === 'home' && (
            <div className="flex flex-col items-center justify-center h-full text-center w-full">
              <div className="mb-8">
                <img src={pokeballSvg} alt="Pokéball" className="w-28 h-28 mb-4 mx-auto" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Open Your Pokémon Packs
              </h2>
              
              <div className="mb-6">
                <StorageStatus savedCardsCount={favorites.length} />
              </div>
              
              <Button
                onClick={handleOpenPack}
                disabled={isLoading || !isInitialized}
                variant="hero"
                size="lg"
                className="text-lg px-8 py-6"
                aria-label={!isInitialized ? "Initializing app" : isLoading ? "Opening pack, please wait" : "Open a new Pokémon card pack"}
              >
                {!isInitialized ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Loading...
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

