import React from 'react';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { CardData, PackType } from '@/types/pokemon';
import { openPack } from '@/services/pokemonTcgApi';
import { Button } from '@/components/ui/button';
import { CardViewer } from '@/components/CardViewer';
import { EnhancedPackOpening } from '@/components/EnhancedPackOpening';
import { PackSelection } from '@/components/PackSelection';
import { RareCardReveal } from '@/components/RareCardReveal';
import { CardFanPreview } from '@/components/CardFanPreview';
import { AudioControls } from '@/components/AudioControls';
import { AnimationSpeedControl, useAnimationSpeed } from '@/components/AnimationSpeedControl';
import { Sparkles, Heart } from 'lucide-react';
// import { Calendar as CalendarIcon } from 'lucide-react'; // Hidden for now - advent calendar feature
import { toast } from 'sonner';
import gsap from 'gsap';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import pokeballSvg from '@/assets/pokeball.svg';
import { PokemonTCGError } from '@/services/pokemonTcgApi';
import { DevModeToggle } from '@/components/DevModeToggle';
import { getDefaultPackType } from '@/data/packTypes';
import { generatePackWithWeights, analyzePackContents } from '@/lib/packGenerator';

// Lazy load the Dashboard component since it's only used occasionally
const Dashboard = lazy(() => import('@/components/Dashboard').then(module => ({ default: module.Dashboard })));
// Lazy load the Advent Calendar component - Hidden for now
// const AdventCalendar = lazy(() => import('@/components/advent/AdventCalendar').then(module => ({ default: module.AdventCalendar })));

// Storage Status Component
const StorageStatus = ({ savedCardsCount }: { savedCardsCount: number }) => {
  const [storageInfo, setStorageInfo] = useState<{ 
    canOpen: boolean; 
    message: string; 
    remainingSlots: number;
    sessionCards: number;
    isLoading: boolean;
  }>({
    canOpen: true,
    message: 'Loading...',
    remainingSlots: 32,
    sessionCards: 0,
    isLoading: false
  });

  useEffect(() => {
    let isMounted = true;
    
    const updateStorageInfo = async () => {
      // Skip update if component is unmounted
      if (!isMounted) return;
      
      try {
        const { canOpenPack, getSessionStats } = await import('@/services/sessionCardManager');
        
        // Skip update if component is unmounted
        if (!isMounted) return;
        
        const packCheck = canOpenPack(savedCardsCount);
        const stats = getSessionStats();
        
        setStorageInfo(prevState => {
          // Don't update state if values haven't changed
          if (prevState.canOpen === packCheck.canOpen &&
              prevState.remainingSlots === packCheck.remainingSlots &&
              prevState.sessionCards === stats.totalCards &&
              prevState.isLoading === stats.isLoading) {
            return prevState;
          }
          
          return {
            canOpen: packCheck.canOpen,
            message: packCheck.message,
            remainingSlots: packCheck.remainingSlots,
            sessionCards: stats.totalCards,
            isLoading: stats.isLoading
          };
        });
      } catch (error) {
        console.error('Error checking storage capacity:', error);
        
        // Skip update if component is unmounted
        if (!isMounted) return;
        
        setStorageInfo(prevState => ({
          ...prevState,
          canOpen: true,
          message: 'Storage status unavailable'
        }));
      }
    };

    // Initial update
    updateStorageInfo();
    
    // Update periodically but not too frequently
    const interval = setInterval(updateStorageInfo, 3000);
    
    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [savedCardsCount]);

  return (
    <div className="text-center space-y-1">
      <div className={`text-sm ${!storageInfo.canOpen ? 'text-red-500' : 'text-muted-foreground'}`}>
        Saved: {savedCardsCount}/32 cards
      </div>
      <div className="text-xs text-muted-foreground">
        {storageInfo.sessionCards > 0 ? (
          <>Session: {storageInfo.sessionCards} cards available</>
        ) : (
          <>No cards in session - downloading...</>
        )}
        {storageInfo.isLoading && (
          <span className="ml-2 text-muted-foreground/70">Loading...</span>
        )}
      </div>
      {!storageInfo.canOpen && (
        <div className="text-xs text-red-500">
          Remove {8 - storageInfo.remainingSlots} cards to open pack
        </div>
      )}
    </div>
  );
};

type View = 'home' | 'pack-selection' | 'opening' | 'rare-reveal' | 'fan-preview' | 'viewing' | 'completed' | 'dashboard'; // | 'advent' - Hidden for now

const Index = () => {
  const [view, setView] = useState<View>('home');
  const [currentPack, setCurrentPack] = useSessionStorage<CardData[]>('currentPack', []);
  const [favorites, setFavorites] = useSessionStorage<CardData[]>('favorites', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PokemonTCGError | null>(null);
  const viewRootRef = useRef<HTMLDivElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isInitialDownloadComplete, setIsInitialDownloadComplete] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [sessionIsLoading, setSessionIsLoading] = useState(false);
  const [selectedPackType, setSelectedPackType] = useState<PackType | null>(null);
  const [animationSpeed] = useAnimationSpeed();
  const [currentRareCardIndex, setCurrentRareCardIndex] = useState(0);

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

  // Monitor session loading state
  useEffect(() => {
    let isMounted = true;
    let checkInterval: number | null = null;
    
    const checkSessionLoading = async () => {
      if (!isMounted) return;
      
      try {
        const { getSessionStats } = await import('@/services/sessionCardManager');
        const stats = getSessionStats();
        
        if (isMounted) {
          setSessionIsLoading(stats.isLoading);
        }
      } catch (error) {
        console.error('[Index] Error checking session loading state:', error);
      }
    };
    
    // Check immediately
    checkSessionLoading();
    
    // Check periodically
    checkInterval = window.setInterval(checkSessionLoading, 1000);
    
    return () => {
      isMounted = false;
      if (checkInterval !== null) {
        window.clearInterval(checkInterval);
      }
    };
  }, []);

  // Check initial download status on mount
  useEffect(() => {
    let isMounted = true;
    let checkInterval: number | null = null;
    let timeoutId: number | null = null;
    
    const MINIMUM_CARDS_FOR_PACK = 8; // Need at least 8 cards to open a pack
    
    const checkInitialDownloadStatus = async () => {
      if (!isMounted) return;
      
      try {
        const { getSessionStats } = await import('@/services/sessionCardManager');
        
        // Prevent state updates if unmounted
        if (!isMounted) return;
        
        const stats = getSessionStats();
        const availableCards = stats.totalCards - stats.shownCards;
        
        console.log('[Index] Checking cards: Total:', stats.totalCards, 'Available:', availableCards);
        
        // Only mark as complete if we have enough cards to open a pack
        if (availableCards >= MINIMUM_CARDS_FOR_PACK) {
          setIsInitialDownloadComplete(true);
          console.log('[Index] Enough cards available to open pack:', availableCards);
        } else {
          // Not enough cards yet, keep waiting
          console.log('[Index] Not enough cards yet. Need', MINIMUM_CARDS_FOR_PACK, 'but have', availableCards);
          toast.info('Preparing cards for offline play...');
          
          // Check periodically until cards are available
          // Store the interval ID so we can clear it in cleanup
          checkInterval = window.setInterval(() => {
            if (!isMounted) return;
            
            try {
              const currentStats = getSessionStats();
              const currentAvailable = currentStats.totalCards - currentStats.shownCards;
              
              console.log('[Index] Periodic check - Available cards:', currentAvailable);
              
              if (currentAvailable >= MINIMUM_CARDS_FOR_PACK) {
                if (isMounted) {
                  setIsInitialDownloadComplete(true);
                  console.log('[Index] Cards ready! Available:', currentAvailable);
                  toast.success('Cards ready! You can now open packs.');
                }
                
                // Clear the interval once we have enough cards
                if (checkInterval !== null) {
                  window.clearInterval(checkInterval);
                  checkInterval = null;
                }
              }
            } catch (checkError) {
              console.error('[Index] Error during periodic check:', checkError);
            }
          }, 1000);
          
          // Clear interval after 30 seconds to avoid infinite checking
          timeoutId = window.setTimeout(() => {
            if (checkInterval !== null) {
              window.clearInterval(checkInterval);
              checkInterval = null;
            }
            
            if (isMounted && !isInitialDownloadComplete) {
              console.warn('[Index] Initial download timeout, allowing pack opening anyway');
              setIsInitialDownloadComplete(true);
            }
          }, 30000);
        }
      } catch (error) {
        console.error('[Index] Error checking initial download status:', error);
        // Allow pack opening even if check fails
        if (isMounted) {
          setIsInitialDownloadComplete(true);
        }
      }
    };
    
    checkInitialDownloadStatus();
    
    // Clean up all timers when component unmounts
    return () => {
      isMounted = false;
      
      if (checkInterval !== null) {
        window.clearInterval(checkInterval);
      }
      
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []); // No dependencies - only run once on mount

  const handleOpenPack = async (packType?: PackType) => {
    if (isLoading || !isInitialDownloadComplete || sessionIsLoading) return; // prevent multiple clicks and simultaneous operations

    // Use provided pack type or default
    const selectedPack = packType || selectedPackType || getDefaultPackType();
    setSelectedPackType(selectedPack);

    setIsLoading(true);
    setError(null); // Clear any previous errors
    toast.info('Fetching cards from API...');

    console.log('🎯 Starting pack opening process with pack type:', selectedPack.name);
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
      
      // Get MORE cards from session storage than we need (to have variety for weighted selection)
      // OPTIMIZED: Reduced from 32 to 3x pack size for faster API fetching
      const cardsNeeded = selectedPack.cardCount * 3; // Get 3x the pack size for variety (was 4x/32)
      console.log(`[Index] Requesting ${cardsNeeded} cards from session storage for weighted pack generation`);
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

      // PERFORMANCE: Only convert the cards we actually need (not all session cards)
      const cardsToConvert = sessionCards.slice(0, cardsNeeded);

      // Convert session cards to card data format (now async for API rarity fetch - HOTFIX)
      console.log(`[Index] Converting ${cardsToConvert.length} cards (API fetch with caching)...`);
      const availableCards = await convertSessionCardToCardData(cardsToConvert);
      console.log(`[Index] Converted ${availableCards.length} session cards to CardData format with rarities`);

      // Generate pack using weighted rarity system
      console.log(`[Index] Generating ${selectedPack.name} with weights:`, selectedPack.rarityWeights);
      const cards = generatePackWithWeights(availableCards, selectedPack);

      if (cards.length === 0) {
        throw new PokemonTCGError('Failed to generate pack. Please try again.', 'NO_DATA');
      }

      // Analyze pack contents
      const packAnalysis = analyzePackContents(cards);
      console.log(`✅ ${selectedPack.name} opened in ${duration}s:`, {
        total: cards.length,
        hasRare: packAnalysis.hasRare,
        hasUltraRare: packAnalysis.hasUltraRare,
        rareCount: packAnalysis.rareCount,
        ultraRareCount: packAnalysis.ultraRareCount,
      });

      // Show toast with pack contents
      if (packAnalysis.hasUltraRare) {
        toast.success(`🌟 ULTRA RARE! You got ${packAnalysis.ultraRareCount} ultra-rare card${packAnalysis.ultraRareCount > 1 ? 's' : ''}!`, {
          duration: 5000,
        });
      } else if (packAnalysis.hasRare) {
        toast.success(`✨ RARE! You got ${packAnalysis.rareCount} rare card${packAnalysis.rareCount > 1 ? 's' : ''}!`, {
          duration: 4000,
        });
      }

      // Mark the cards we used as shown
      const usedSessionCards = sessionCards.slice(0, cards.length);
      markCardsAsShown(usedSessionCards.map(card => card.id));
      
      // Trigger background refresh if needed
      if (needsRefresh) {
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
            <h1 className="text-2xl font-bold hidden lg:block">Jenny's Pokedex</h1>
          </div>
          
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              onClick={() => setView('home')}
              disabled={view === 'home'}
            >
              Home
            </Button>
            {/* Hidden for now - advent calendar button
            <Button
              variant="ghost"
              onClick={() => setView('advent')}
              disabled={view === 'advent'}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <CalendarIcon className="w-4 h-4 mr-1" />
              Advent
            </Button>
            */}
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
            <div className="border-l border-border/50 h-6 mx-1" />
            <AnimationSpeedControl />
            <AudioControls />
            <ThemeToggle />
            <DevModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${view === 'dashboard' ? 'overflow-hidden' : 'flex items-center justify-center px-4 py-8'} min-h-0`}>
        {/* view transition wrapper */}
        <div id="view-root" ref={viewRootRef} className={`w-full ${view === 'dashboard' ? 'h-full' : 'max-w-4xl flex items-center justify-center'}`}>
          {view === 'home' && (
            <div className="flex flex-col items-center justify-center h-full text-center w-full">
              {/* Advent Calendar Promo Banner - Hidden for now
              <div className="mb-6 w-full max-w-2xl">
                <div
                  className="bg-gradient-to-r from-red-600 via-green-600 to-red-600 p-1 rounded-lg cursor-pointer transform transition-all hover:scale-105"
                  onClick={() => setView('advent')}
                >
                  <div className="bg-background rounded-md p-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <CalendarIcon className="w-6 h-6 text-red-600" />
                      <h3 className="text-xl font-bold text-red-600">Christmas Advent Calendar</h3>
                      <CalendarIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Open special packs daily from December 1-24 with custom cards! 🎄
                    </p>
                  </div>
                </div>
              </div>
              */}

              <div className="mb-8">
                <img src={pokeballSvg} alt="Pokéball" className="w-28 h-28 mb-4 mx-auto" />
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Jenny's Pokedex
              </h2>
              
              <div className="mb-6">
                <StorageStatus savedCardsCount={favorites.length} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setView('pack-selection')}
                  disabled={isLoading || !isInitialDownloadComplete || isBackgroundLoading || sessionIsLoading}
                  variant="hero"
                  size="lg"
                  className="text-lg px-8 py-6"
                  aria-label={!isInitialDownloadComplete ? "Preparing cards for pack opening" : "Choose a pack type to open"}
                >
                  {!isInitialDownloadComplete ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Preparing Cards...
                    </>
                  ) : sessionIsLoading ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Downloading Cards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Choose Pack Type
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleOpenPack()}
                  disabled={isLoading || !isInitialDownloadComplete || isBackgroundLoading || sessionIsLoading}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6"
                >
                  Quick Open (Standard)
                </Button>
              </div>
            </div>
          )}

          {view === 'pack-selection' && (
            <PackSelection
              onSelectPack={(packType) => {
                setSelectedPackType(packType);
                handleOpenPack(packType);
              }}
              isLoading={isLoading}
              isCardsReady={isInitialDownloadComplete && !sessionIsLoading}
            />
          )}

          {view === 'opening' && selectedPackType && (
            <EnhancedPackOpening
              onComplete={() => {
                // Check if pack has rare cards
                const rareCards = currentPack.filter(card =>
                  ['rare', 'ultra-rare'].includes(card.rarity)
                );

                if (rareCards.length > 0) {
                  setCurrentRareCardIndex(0);
                  setView('rare-reveal');
                } else {
                  setView('fan-preview');
                }
              }}
              hasRareCard={currentPack.some(card =>
                card.rarity === 'rare' || card.rarity === 'ultra-rare'
              )}
              hasUltraRare={currentPack.some(card =>
                card.rarity === 'ultra-rare'
              )}
              guaranteedRare={selectedPackType.guaranteedRare || false}
              animationSpeed={animationSpeed}
              packDesign={selectedPackType.design}
              cardCount={currentPack.length}
            />
          )}

          {view === 'rare-reveal' && currentPack.length > 0 && (
            <RareCardReveal
              card={currentPack.filter(card =>
                ['rare', 'ultra-rare'].includes(card.rarity)
              )[currentRareCardIndex]}
              onComplete={() => {
                const rareCards = currentPack.filter(card =>
                  ['rare', 'ultra-rare'].includes(card.rarity)
                );

                // Show next rare card if available
                if (currentRareCardIndex < rareCards.length - 1) {
                  setCurrentRareCardIndex(currentRareCardIndex + 1);
                } else {
                  // All rare cards shown, move to fan preview
                  setCurrentRareCardIndex(0);
                  setView('fan-preview');
                }
              }}
              duration={3000}
            />
          )}

          {view === 'fan-preview' && currentPack.length > 0 && (
            <CardFanPreview
              cards={currentPack}
              onComplete={() => setView('viewing')}
              duration={2000}
            />
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
                  disabled={isLoading || sessionIsLoading}
                  variant="hero"
                  size="lg"
                  className="text-lg px-8 py-6 h-auto"
                >
                  <Sparkles className="mr-2 w-6 h-6" />
                  {isLoading ? 'Opening...' : sessionIsLoading ? 'Downloading...' : 'Open Another Pack'}
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

          {/* Hidden for now - advent calendar view
          {view === 'advent' && (
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              </div>
            }>
              <AdventCalendar
                onBackToHome={() => setView('home')}
                favorites={favorites}
                onAddToFavorites={(card) => setFavorites([...favorites, card])}
                onRemoveFavorite={handleRemoveFavorite}
              />
            </Suspense>
          )}
          */}
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

        {/* Dev Mode Toggle */}
        <DevModeToggle />
      </main>
    </div>
  );
};

export default Index;

