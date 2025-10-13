import { CardData } from '@/types/pokemon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Star, Zap, Crown } from 'lucide-react';

interface CollectionStatsProps {
  cards: CardData[];
}

interface RarityStats {
  common: number;
  uncommon: number;
  rare: number;
  'ultra-rare': number;
}

export const CollectionStats = ({ cards }: CollectionStatsProps) => {
  const rarityStats: RarityStats = cards.reduce((acc, card) => {
    const rarity = card.rarity?.toLowerCase() || 'common';
    if (rarity in acc) {
      acc[rarity as keyof RarityStats]++;
    } else {
      acc.common++;
    }
    return acc;
  }, { common: 0, uncommon: 0, rare: 0, 'ultra-rare': 0 });

  const totalCards = cards.length;
  const uniqueSets = new Set(cards.map(card => card.card.set)).size;
  const averageRarity = totalCards > 0 ? 
    (rarityStats.rare + rarityStats['ultra-rare']) / totalCards : 0;

  const rarityColors = {
    common: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    uncommon: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rare: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'ultra-rare': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  };

  const rarityIcons = {
    common: <BarChart3 className="w-4 h-4" />,
    uncommon: <Star className="w-4 h-4" />,
    rare: <Zap className="w-4 h-4" />,
    'ultra-rare': <Crown className="w-4 h-4" />
  };

  if (totalCards === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Collection Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No cards in your collection yet. Start opening packs to build your collection!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCards}</div>
          <p className="text-xs text-muted-foreground">
            {uniqueSets} unique set{uniqueSets !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Rarity Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rarity Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(rarityStats).map(([rarity, count]) => {
            const percentage = totalCards > 0 ? (count / totalCards * 100).toFixed(1) : '0';
            return (
              <div key={rarity} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rarityIcons[rarity as keyof typeof rarityIcons]}
                  <span className="text-sm capitalize">{rarity.replace('-', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={rarityColors[rarity as keyof typeof rarityColors]}>
                    {count}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Collection Quality */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Collection Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageRarity > 0.3 ? '⭐' : averageRarity > 0.1 ? '✨' : '🌟'}
          </div>
          <p className="text-xs text-muted-foreground">
            {averageRarity > 0.3 ? 'Excellent' : averageRarity > 0.1 ? 'Good' : 'Growing'} collection
          </p>
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, averageRarity * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionStats;
