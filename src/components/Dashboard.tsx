import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useState, useMemo } from 'react';
import { Trash, Download } from 'lucide-react';

function exportFavoritesAsCSV(favorites: CardData[]) {
  if (!favorites || favorites.length === 0) return;
  const headers = ['id','name','set','rarity','image_small','image_large'];
  const rows = favorites.map(f => [
    f.id,
    `"${(f.card.name || '').replace(/"/g,'""')}"`,
    `"${(f.card.set?.name || '').replace(/"/g,'""')}"`,
    f.rarity || '',
    f.card.images.small || '',
    f.card.images.large || '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'favorites.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface DashboardProps {
  favorites: CardData[];
  onRemoveFavorite: (cardId: string) => void;
  onBackToHome: () => void;
}

export const Dashboard = ({ favorites, onRemoveFavorite, onBackToHome }: DashboardProps) => {
  const [selected, setSelected] = useState<CardData | null>(null);

  // prefetched images for faster modal open (small set)
  useMemo(() => {
    favorites.slice(0, 10).forEach((f) => {
      const img = new Image();
      img.src = f.card.images.small || f.card.images.large;
    });
  }, [favorites]);

  const handleExport = () => exportFavoritesAsCSV(favorites);

  const handleClearSession = () => {
    try {
      window.sessionStorage.removeItem('currentPack');
      window.sessionStorage.removeItem('favorites');
      // also remove any other keys that start with 'pack' or 'fav'
      // (careful: keep it minimal to avoid removing unrelated keys)
    } catch (e) {
      console.error(e);
    }
    // reload to reflect cleared session
    window.location.reload();
  };
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Heart className="w-10 h-10 text-pokemon-red fill-pokemon-red" />
            Your Collection
          </h1>
          <div className="flex items-center gap-3">
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Favorites → CSV
            </Button>
            <Button onClick={handleClearSession} variant="destructive" className="flex items-center gap-2">
              <Trash className="w-4 h-4" />
              Clear Session
            </Button>
            <Button onClick={onBackToHome} variant="outline">
              Back to Home
            </Button>
          </div>
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
                  <PokemonCard card={card} size="small" onClick={() => setSelected(card)} />
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

      {/* Modal for selected card (controlled) */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selected.card.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img src={selected.card.images.large} alt={selected.card.name} className="w-full h-auto rounded-md" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Set: {selected.card.set.name}</p>
                <p className="text-sm text-muted-foreground">Rarity: {selected.rarity || 'Unknown'}</p>
                <p className="mt-4">{selected.card.flavorText || selected.card.abilities?.[0]?.text || ''}</p>
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2 w-full justify-end">
                <Button
                  variant="destructive"
                  onClick={() => {
                    onRemoveFavorite(selected.id);
                    setSelected(null);
                  }}
                >
                  Remove
                </Button>
                <Button onClick={() => setSelected(null)} variant="outline">Close</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
