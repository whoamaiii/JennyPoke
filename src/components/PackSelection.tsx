import { useState } from 'react';
import { PackType } from '@/types/pokemon';
import { PACK_TYPES } from '@/data/packTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown, HelpCircle } from 'lucide-react';

interface PackSelectionProps {
  onSelectPack: (packType: PackType) => void;
  isLoading?: boolean;
  isCardsReady?: boolean;
}

export const PackSelection = ({
  onSelectPack,
  isLoading = false,
  isCardsReady = true
}: PackSelectionProps) => {
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [hoveredPack, setHoveredPack] = useState<string | null>(null);

  const getPackIcon = (design: string) => {
    switch (design) {
      case 'standard':
        return <Sparkles className="w-6 h-6" />;
      case 'premium':
        return <Zap className="w-6 h-6" />;
      case 'ultra':
        return <Crown className="w-6 h-6" />;
      case 'mystery':
        return <HelpCircle className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getPackGradient = (design: string) => {
    switch (design) {
      case 'standard':
        return 'from-primary via-secondary to-accent';
      case 'premium':
        return 'from-slate-300 via-slate-400 to-slate-500';
      case 'ultra':
        return 'from-yellow-400 via-yellow-500 to-orange-500';
      case 'mystery':
        return 'from-purple-900 via-indigo-900 to-black';
      default:
        return 'from-primary via-secondary to-accent';
    }
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const handleSelectPack = (pack: PackType) => {
    setSelectedPack(pack);
  };

  const handleConfirm = () => {
    if (selectedPack) {
      onSelectPack(selectedPack);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Choose Your Pack</h1>
        <p className="text-muted-foreground text-lg">
          Different pack types offer different rarity odds and experiences
        </p>
      </div>

      {/* Pack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {PACK_TYPES.map((pack) => {
          const isSelected = selectedPack?.id === pack.id;
          const isHovered = hoveredPack === pack.id;

          return (
            <Card
              key={pack.id}
              className={`cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'ring-2 ring-primary shadow-xl scale-105'
                  : 'hover:shadow-lg hover:scale-102'
              }`}
              onClick={() => handleSelectPack(pack)}
              onMouseEnter={() => setHoveredPack(pack.id)}
              onMouseLeave={() => setHoveredPack(null)}
            >
              {/* Pack Visual */}
              <div
                className={`h-48 bg-gradient-to-br ${getPackGradient(
                  pack.design
                )} rounded-t-lg flex items-center justify-center relative overflow-hidden`}
              >
                <div className={`text-white transform transition-transform ${isHovered ? 'scale-110' : 'scale-100'}`}>
                  {getPackIcon(pack.design)}
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />

                {/* Guaranteed Rare Badge */}
                {pack.guaranteedRare && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
                    Rare Guaranteed
                  </Badge>
                )}
              </div>

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {pack.name}
                </CardTitle>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Card Count */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cards:</span>
                  <span className="font-medium">{pack.cardCount}</span>
                </div>

                {/* Rarity Odds */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mb-2">Rarity Odds:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Common:</span>
                      <span>{formatPercentage(pack.rarityWeights.common)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Uncommon:</span>
                      <span>{formatPercentage(pack.rarityWeights.uncommon)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Rare:</span>
                      <span>{formatPercentage(pack.rarityWeights.rare)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">Ultra-Rare:</span>
                      <span>{formatPercentage(pack.rarityWeights['ultra-rare'])}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleSelectPack(pack)}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Confirm Button */}
      {selectedPack && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          {!isCardsReady && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ⏳ Downloading cards... Please wait
              </p>
            </div>
          )}
          <Button
            size="lg"
            onClick={handleConfirm}
            className="min-w-[200px]"
            disabled={isLoading || !isCardsReady}
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin mr-2" />
                Opening...
              </>
            ) : !isCardsReady ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin mr-2" />
                Preparing Cards...
              </>
            ) : (
              `Open ${selectedPack.name}`
            )}
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>
          Choose wisely! Each pack type offers a unique opening experience.
        </p>
        {!isCardsReady && (
          <p className="mt-4 text-xs text-yellow-500">
            ⏳ Cards are being downloaded in the background. This only happens once!
          </p>
        )}
      </div>
    </div>
  );
};
