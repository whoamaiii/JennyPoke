import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Button } from './ui/button';
import { Trash2, Sparkles } from 'lucide-react';

interface DashboardProps {
  favorites: CardData[];
  onRemove: (cardId: string) => void;
  onOpenPack: () => void;
}

export const Dashboard = ({ favorites, onRemove, onOpenPack }: DashboardProps) => {
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Favorites Yet</h2>
        <p className="text-muted-foreground mb-8">
          Open a pack and swipe right on cards you like!
        </p>
        <Button onClick={onOpenPack} variant="hero" size="lg">
          Open Your First Pack
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Your Collection</h2>
          <p className="text-muted-foreground">{favorites.length} card{favorites.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={onOpenPack} variant="hero">
          Open New Pack
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((card) => (
          <div key={card.id} className="relative group">
            <PokemonCard card={card} />
            <Button
              onClick={() => onRemove(card.id)}
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
