import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';

interface DashboardProps {
  favorites: CardData[];
  onRemoveFavorite: (cardId: string) => void;
  onBackToHome: () => void;
}

export const Dashboard = ({ favorites, onRemoveFavorite, onBackToHome }: DashboardProps) => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Heart className="w-10 h-10 text-pokemon-red fill-pokemon-red" />
            Your Collection
          </h1>
          <Button onClick={onBackToHome} variant="outline">
            Back to Home
          </Button>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground mb-4">No favorites yet!</p>
            <p className="text-muted-foreground">Swipe right on cards you like to add them to your collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((card) => (
              <div key={card.id} className="relative group">
                <div className="transition-transform hover:scale-105">
                  <PokemonCard card={card} />
                </div>
                <Button
                  onClick={() => onRemoveFavorite(card.id)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </Button>
                <div className="mt-2 text-center">
                  <p className="font-semibold">{card.card.name}</p>
                  <p className="text-sm text-muted-foreground">{card.card.set.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
