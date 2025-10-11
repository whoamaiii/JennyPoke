import { useState } from 'react';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { CardData } from '@/types/pokemon';
import { openPack } from '@/services/pokemonApi';
import { Button } from '@/components/ui/button';
import { CardViewer } from '@/components/CardViewer';
import { Dashboard } from '@/components/Dashboard';
import { PackOpening } from '@/components/PackOpening';
import { Sparkles, Heart } from 'lucide-react';
import { toast } from 'sonner';

type View = 'home' | 'opening' | 'viewing' | 'dashboard';

const Index = () => {
  const [view, setView] = useState<View>('home');
  const [currentPack, setCurrentPack] = useSessionStorage<CardData[]>('currentPack', []);
  const [favorites, setFavorites] = useSessionStorage<CardData[]>('favorites', []);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenPack = async () => {
    setIsLoading(true);
    try {
      const cards = await openPack();
      setCurrentPack(cards);
      setView('opening');
      toast.success('Pack opened! Swipe through your cards!');
    } catch (error) {
      toast.error('Failed to open pack. Try again!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = (cardId: string, favorite: boolean) => {
    if (favorite) {
      const card = currentPack.find((c) => c.id === cardId);
      if (card) {
        setFavorites([...favorites, card]);
        toast.success(`Added ${card.pokemon.name} to favorites!`, {
          icon: <Heart className="w-4 h-4" fill="currentColor" />,
        });
      }
    }
  };

  const handleViewingComplete = () => {
    setCurrentPack([]);
    setView('dashboard');
  };

  const handleRemoveFavorite = (cardId: string) => {
    const card = favorites.find((c) => c.id === cardId);
    setFavorites(favorites.filter((c) => c.id !== cardId));
    if (card) {
      toast.info(`Removed ${card.pokemon.name} from favorites`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <div className="mb-8 animate-float">
              <div className="text-9xl mb-4">🎴</div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Open Your Pokémon Pack
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
              Discover 10 random Pokémon cards. Swipe right to save your favorites!
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
          <div className="min-h-[80vh]">
            <CardViewer
              cards={currentPack}
              onSwipe={handleSwipe}
              onComplete={handleViewingComplete}
            />
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard
            favorites={favorites}
            onRemove={handleRemoveFavorite}
            onOpenPack={handleOpenPack}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
