import { /* useState removed (declared below) */ } from 'react';
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

type View = 'home' | 'opening' | 'viewing' | 'completed' | 'dashboard';

const Index = () => {
  const [view, setView] = useState<View>('home');
  const [currentPack, setCurrentPack] = useSessionStorage<CardData[]>('currentPack', []);
  const [favorites, setFavorites] = useSessionStorage<CardData[]>('favorites', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PokemonTCGError | null>(null);
  const viewRootRef = useRef<HTMLDivElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!viewRootRef.current) return;
    gsap.fromTo(
      viewRootRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
    );
  }, [view]);

  const handleOpenPack = async () => {
    if (isLoading) return; // prevent multiple clicks
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const cards = await openPack();
      if (cards.length === 0) {
        throw new PokemonTCGError('No cards available. Please try again later.', 'NO_DATA');
      }
      setCurrentPack(cards);
      setView('opening');
      toast.success('Pack opened! Swipe through your cards!');
    } catch (error) {
      const pokemonError = error instanceof PokemonTCGError ? error :
        new PokemonTCGError('An unexpected error occurred. Please try again.', 'UNKNOWN', error);

      setError(pokemonError);

      // Show appropriate toast message based on error type
      switch (pokemonError.code) {
        case 'TIMEOUT':
          toast.error('Request timed out. Please check your connection and try again.');
          break;
        case 'NETWORK':
          toast.error('Connection failed. Please check your internet and try again.');
          break;
        case 'API_ERROR':
          toast.error(pokemonError.message);
          break;
        case 'NO_DATA':
          toast.error('No cards available right now. Please try again later.');
          break;
        default:
          toast.error('Something went wrong. Please try again.');
      }

      console.error('Pack opening error:', pokemonError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    handleOpenPack();
  };

  const handleSwipe = (cardId: string, favorite: boolean) => {
    if (favorite) {
      const card = currentPack.find((c) => c.id === cardId);
      if (card) {
        setFavorites([...favorites, card]);
        toast.success(`Added ${card.card.name} to favorites!`, {
          icon: <Heart className="w-4 h-4" fill="currentColor" />,
        });
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
            <h1 className="text-2xl font-bold">Pokémon Pack Opener</h1>
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
              Collection ({favorites.length})
            </Button>
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setHelpOpen(true)}>
              Help
            </Button>
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
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Open Your Pokémon Pack
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
              Discover 8 random Pokémon cards. Swipe right to save your favorites!
            </p>
            
            <Button
              onClick={handleOpenPack}
              disabled={isLoading}
              variant="hero"
              size="lg"
              className="text-lg px-8 py-6"
            >
              {isLoading ? (
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

            {error && (
              <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <p className="text-sm font-medium text-destructive">Connection Error</p>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {error.message}
                </p>
                <Button
                  onClick={handleRetry}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? 'Retrying...' : 'Try Again'}
                </Button>
              </div>
            )}

            {favorites.length > 0 && (
              <div className="mt-12">
                <Button
                  variant="outline"
                  onClick={() => setView('dashboard')}
                  className="text-sm"
                >
                  View Collection ({favorites.length} cards)
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
                onClick={handleOpenPack}
                variant="hero"
                size="lg"
                className="text-lg px-8 py-6 h-auto"
              >
                <Sparkles className="mr-2 w-6 h-6" />
                Open Another Pack
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
                <li>Click card to flip and reveal</li>
                <li>Swipe → Next</li>
                <li>Swipe ← Favourite</li>
                <li>Press SPACE to flip card</li>
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
