import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdventPackGenerator } from '@/services/advent/adventPackGenerator';
import { CardData } from '@/types/pokemon';
import { CardViewer } from '@/components/CardViewer';
import { PackOpening } from '@/components/PackOpening';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface AdventPackOpeningProps {
  day: number;
  onComplete: () => void;
  onBackToCalendar: () => void;
  favorites: CardData[];
  onAddToFavorites: (card: CardData) => void;
}

type PackView = 'loading' | 'animation' | 'viewing' | 'completed';

export const AdventPackOpening: React.FC<AdventPackOpeningProps> = ({
  day,
  onComplete,
  onBackToCalendar,
  favorites,
  onAddToFavorites
}) => {
  const [view, setView] = useState<PackView>('loading');
  const [pack, setPack] = useState<CardData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load the pack when component mounts
  useEffect(() => {
    const loadPack = async () => {
      try {
        // Special message for Day 24
        if (day === 24) {
          toast.info('🎄 Preparing your Christmas Eve special pack! 🎄');
        } else {
          toast.info(`Preparing Day ${day} special pack...`);
        }

        const generatedPack = await AdventPackGenerator.generateAdventPack(day);

        if (generatedPack.length === 0) {
          throw new Error('Failed to generate pack - no cards received');
        }

        setPack(generatedPack);
        setView('animation');

        // Special success message for Day 24
        if (day === 24) {
          toast.success('🎅 Merry Christmas! Your most special pack awaits! 🎁');
        } else {
          toast.success(`Day ${day} pack ready!`);
        }
      } catch (err) {
        console.error('Error generating advent pack:', err);
        setError('Failed to load your special pack. Please try again.');
        toast.error('Failed to load pack');
      }
    };

    loadPack();
  }, [day]);

  // Trigger confetti for Day 24
  useEffect(() => {
    if (day === 24 && view === 'viewing') {
      // Initial confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Second burst after a delay
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);
    }
  }, [day, view]);

  const handleSwipe = (cardId: string, favorite: boolean) => {
    if (favorite) {
      // Check if adding this card would exceed the 32 card limit
      if (favorites.length >= 32) {
        toast.error('Cannot add more cards. You have reached the 32 card limit. Remove some cards from favorites to add new ones.', {
          duration: 5000,
        });
        return;
      }

      const card = pack.find(c => c.id === cardId);
      if (card) {
        // Actually add to favorites using the parent handler
        onAddToFavorites(card);

        // Check if it's a custom card
        const isCustom = 'isCustom' in card.card && card.card.isCustom;
        toast.success(
          `Added ${card.card.name} to favorites!`,
          {
            description: isCustom ? '✨ Special custom card saved to your collection!' : undefined,
            duration: 4000
          }
        );
      }
    }
  };

  const handleViewingComplete = () => {
    setView('completed');
  };

  const handleCompleteAndReturn = () => {
    onComplete();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
          <p className="text-white/90 mb-6">{error}</p>
          <Button onClick={onBackToCalendar} variant="outline" className="bg-white/20 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calendar
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-green-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Sparkles className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-3xl font-bold text-white mb-2">
            Preparing Day {day}
          </h2>
          <p className="text-white/80">Creating your special pack...</p>
        </motion.div>
      </div>
    );
  }

  if (view === 'animation') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-green-900">
        <div className="container mx-auto p-4">
          <Button
            onClick={onBackToCalendar}
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calendar
          </Button>
          <PackOpening onComplete={() => setView('viewing')} />
        </div>
      </div>
    );
  }

  if (view === 'viewing' && pack.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-green-900">
        <div className="container mx-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <Button
              onClick={onBackToCalendar}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Calendar
            </Button>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-white/20">
              <p className="text-white font-bold">Day {day} Pack</p>
            </div>
          </div>
          <CardViewer
            cards={pack}
            onSwipe={handleSwipe}
            onComplete={handleViewingComplete}
          />
        </div>
      </div>
    );
  }

  if (view === 'completed') {
    // Special completion message for Day 24
    if (day === 24) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-900 via-green-900 to-red-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-2xl"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Sparkles className="w-32 h-32 text-yellow-400 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
              🎄 Merry Christmas! 🎄
            </h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border-2 border-white/30">
              <p className="text-2xl text-white/95 mb-4 leading-relaxed">
                You've completed all 24 days of the advent calendar!
              </p>
              <p className="text-lg text-white/80 italic">
                Thank you for sharing this journey with me. Every memory, every moment - they're all special because of you. ❤️
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleCompleteAndReturn}
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg px-8 py-6"
              >
                <ArrowLeft className="w-6 h-6 mr-2" />
                Back to Calendar
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }

    // Regular completion message for other days
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-green-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg"
        >
          <Sparkles className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-5xl font-bold text-white mb-4">
            Day {day} Complete!
          </h2>
          <p className="text-xl text-white/90 mb-8">
            You've opened all cards from today's special pack!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleCompleteAndReturn}
              variant="default"
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Calendar
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};
