import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDoor } from './CalendarDoor';
import { AdventPackOpening } from './AdventPackOpening';
import { useAdventProgress } from '@/hooks/advent/useAdventProgress';
import { Button } from '@/components/ui/button';
import { Home, Calendar as CalendarIcon, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { CardData } from '@/types/pokemon';

interface AdventCalendarProps {
  onBackToHome: () => void;
  favorites: CardData[];
  onAddToFavorites: (card: CardData) => void;
  onRemoveFavorite: (cardId: string) => void;
}

type AdventView = 'calendar' | 'opening';

export const AdventCalendar: React.FC<AdventCalendarProps> = ({
  onBackToHome,
  favorites,
  onAddToFavorites,
  onRemoveFavorite
}) => {
  const {
    openedDays,
    markDayOpened,
    isDayOpened,
    isDayAvailable,
    canOpenToday,
    getCurrentDay
  } = useAdventProgress();

  const [view, setView] = useState<AdventView>('calendar');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const currentDay = getCurrentDay();

  const handleDoorClick = (day: number) => {
    if (!isDayAvailable(day)) {
      toast.error(`Day ${day} is not available yet! Come back on December ${day}th.`);
      return;
    }

    if (isDayOpened(day)) {
      toast.info(`You already opened Day ${day}! Each day can only be opened once.`);
      return;
    }

    // Open the door and show the pack
    setSelectedDay(day);
    setView('opening');
    markDayOpened(day);
    toast.success(`Opening Day ${day}! Enjoy your special pack!`);
  };

  const handlePackComplete = () => {
    setView('calendar');
    setSelectedDay(null);
  };

  if (view === 'opening' && selectedDay) {
    return (
      <AdventPackOpening
        day={selectedDay}
        onComplete={handlePackComplete}
        onBackToCalendar={handlePackComplete}
        favorites={favorites}
        onAddToFavorites={onAddToFavorites}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-green-900 to-red-900 py-8 px-4">
      {/* Header */}
      <div className="container mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <Gift className="w-12 h-12 text-yellow-400" />
            <h1 className="text-4xl md:text-6xl font-bold text-white text-center drop-shadow-lg">
              Christmas Advent Calendar
            </h1>
            <Gift className="w-12 h-12 text-yellow-400" />
          </div>
          <p className="text-xl text-white/90 text-center max-w-2xl">
            Open one special pack each day from December 1st to 24th!
          </p>

          {/* Progress */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border-2 border-white/20">
            <p className="text-white text-lg font-semibold">
              <CalendarIcon className="inline w-5 h-5 mr-2" />
              Progress: {openedDays.length} / 24 days opened
            </p>
          </div>
        </motion.div>

        {/* Back button */}
        <div className="flex justify-center mb-4">
          <Button
            onClick={onBackToHome}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Regular Packs
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="container mx-auto"
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {Array.from({ length: 24 }, (_, i) => {
            const day = i + 1;
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <CalendarDoor
                  day={day}
                  isAvailable={isDayAvailable(day)}
                  isOpened={isDayOpened(day)}
                  isToday={currentDay === day}
                  onClick={() => handleDoorClick(day)}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="container mx-auto mt-12 max-w-2xl"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-white/20 text-white">
          <h3 className="text-xl font-bold mb-3">How it works:</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li>One special pack unlocks each day from December 1st to 24th</li>
            <li>Today's door is highlighted in gold</li>
            <li>Each pack contains custom cards with personal memories</li>
            <li>You can only open each day's door once - make it count!</li>
            <li>Locked doors will automatically unlock on their date</li>
          </ul>
          {currentDay && !isDayOpened(currentDay) && (
            <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg border-2 border-yellow-400">
              <p className="font-bold text-yellow-200">
                Today is Day {currentDay}! Don't forget to open your special pack!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
