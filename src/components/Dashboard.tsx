import { CardData, PokemonTCGCard } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Button } from './ui/button';
import { Heart, Trash, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

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

// Cache for card details to avoid repeated API calls
const cardDetailsCache: Record<string, PokemonTCGCard> = {};

export const Dashboard = ({ favorites, onRemoveFavorite, onBackToHome }: DashboardProps) => {
  const [selected, setSelected] = useState<CardData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<PokemonTCGCard | null>(null);

  // prefetched images for faster modal open (small set)
  useMemo(() => {
    favorites.slice(0, 10).forEach((f) => {
      const img = new Image();
      img.src = f.card.images.small || f.card.images.large;
    });
  }, [favorites]);
  
  // Fetch card details when a card is selected
  const fetchCardDetails = useCallback(async (card: CardData) => {
    // If card has isSessionCard flag, it's from session storage and needs API call for details
    const needsDetailsFetch = (card as any).isSessionCard === true;
    const cardId = card.card.id;
    
    // If it doesn't need details or we already have them cached, use cache
    if (!needsDetailsFetch || cardDetailsCache[cardId]) {
      setSelectedDetails(cardDetailsCache[cardId] || card.card);
      return;
    }
    
    // Otherwise fetch details
    setIsLoadingDetails(true);
    
    try {
      // Fetch card details from API
      const API_BASE = 'https://api.pokemontcg.io/v2';
      const response = await fetch(`${API_BASE}/cards/${cardId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const cardDetails = data.data;
      
      // Cache the results
      cardDetailsCache[cardId] = cardDetails;
      setSelectedDetails(cardDetails);
      
    } catch (error) {
      console.error('Error fetching card details:', error);
      toast.error('Could not load full card details');
      // Fall back to basic card info
      setSelectedDetails(card.card);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

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
                <div 
                  className="transition-transform hover:scale-105 cursor-pointer" 
                  onClick={() => {
                    setSelected(card);
                    setSelectedDetails(null); // Clear previous details
                    fetchCardDetails(card); // Fetch details when card is selected
                  }}
                >
                  <img 
                    src={(card as any).imageData || card.card.images.small || card.card.images.large}
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
      <Dialog open={!!selected} onOpenChange={(open) => { 
        if (!open) {
          setSelected(null);
          setSelectedDetails(null);
        }
      }}>
        {selected && (
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] md:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {isLoadingDetails ? 'Loading...' : selectedDetails?.name || selected.card.name}
              </DialogTitle>
            </DialogHeader>
            
            {isLoadingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                <p className="text-muted-foreground">Loading card details...</p>
              </div>
            ) : (
              <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                <div className="flex justify-center items-start">
                  <img 
                    src={(selected as any).imageData || selected.card.images.large || selected.card.images.small} 
                    alt={selectedDetails?.name || selected.card.name} 
                    className="w-full max-w-[245px] h-auto object-contain rounded-lg shadow-lg" 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold">Set</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDetails?.set?.name || selected.card.set.name}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold">Number</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDetails?.number || selected.card.number || 'Unknown'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold">Rarity</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDetails?.rarity || selected.rarity || 'Unknown'}
                    </p>
                  </div>
                  
                  {selectedDetails?.supertype && (
                    <div>
                      <p className="text-sm font-semibold">Type</p>
                      <p className="text-sm text-muted-foreground">{selectedDetails.supertype}</p>
                    </div>
                  )}
                  
                  {selectedDetails?.hp && (
                    <div>
                      <p className="text-sm font-semibold">HP</p>
                      <p className="text-sm text-muted-foreground">{selectedDetails.hp}</p>
                    </div>
                  )}
                  
                  {(selectedDetails?.attacks || selected.card.attacks)?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold">Attacks</p>
                      {(selectedDetails?.attacks || selected.card.attacks)?.map((attack, i) => (
                        <div key={`attack-${i}`} className="mb-2 last:mb-0">
                          <p className="text-sm font-medium">
                            {attack.name} 
                            {attack.damage && <span className="ml-1">({attack.damage})</span>}
                          </p>
                          {attack.text && <p className="text-xs text-muted-foreground">{attack.text}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedDetails?.abilities?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold">Abilities</p>
                      {selectedDetails.abilities.map((ability, i) => (
                        <div key={`ability-${i}`} className="mb-2 last:mb-0">
                          <p className="text-sm font-medium">{ability.name} ({ability.type})</p>
                          <p className="text-xs text-muted-foreground">{ability.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  onRemoveFavorite(selected.id);
                  setSelected(null);
                  setSelectedDetails(null);
                }}
                className="w-full sm:w-auto"
                disabled={isLoadingDetails}
              >
                Remove
              </Button>
              <Button 
                onClick={() => {
                  setSelected(null);
                  setSelectedDetails(null);
                }} 
                variant="outline" 
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
