import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Button } from './ui/button';
import { Heart, Trash, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useState, useMemo } from 'react';

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
    <div className="h-screen flex flex-col p-8">
      <div className="max-w-7xl mx-auto flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Heart className="w-10 h-10 text-pokemon-red fill-pokemon-red" />
            Faves
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-1 text-xs">
              <Download className="w-3 h-3" />
              Export CSV
            </Button>
            <Button onClick={handleClearSession} variant="destructive" size="sm" className="flex items-center gap-1 text-xs">
              <Trash className="w-3 h-3" />
              Remove All
            </Button>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <p className="text-2xl text-muted-foreground mb-4">No favorites yet!</p>
              <p className="text-muted-foreground">Swipe right on cards you like to add them to your collection.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {favorites.map((card) => (
              <div key={card.id} className="flex flex-col items-center">
                <div className="transition-transform hover:scale-105 cursor-pointer" onClick={() => setSelected(card)}>
                  <img 
                    src={card.card.images.small || card.card.images.large}
                    alt={card.card.name}
                    className="w-full max-w-[245px] h-auto object-contain rounded-lg shadow-lg"
                  />
                </div>
                <div className="mt-4 text-center w-full max-w-[245px]">
                  <p className="font-semibold text-lg">{card.card.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">{card.card.set.name}</p>
                  <Button
                    onClick={() => onRemoveFavorite(card.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Remove
                  </Button>
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
              <div className="flex justify-center">
                {/* <div className="w-48 h-56"> */}
                <div className="w-48 h-56">
                  <img 
                    src={selected.card.images.small || selected.card.images.large} 
                    alt={selected.card.name} 
                    className="w-full max-w-[245px] h-auto object-contain rounded-lg shadow-lg" 
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Set: {selected.card.set.name}</p>
                <p className="text-sm text-muted-foreground">Rarity: {selected.rarity || 'Unknown'}</p>
                <p className="mt-4">
                  {selected.card.attacks?.[0]?.name ? 
                    `Attack: ${selected.card.attacks[0].name} (${selected.card.attacks[0].damage})` : 
                    'No attack information available'}
                </p>
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
