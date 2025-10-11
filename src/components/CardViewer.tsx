import { useState } from 'react';
import { useSpring, animated, to } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Heart, X } from 'lucide-react';

interface CardViewerProps {
  cards: CardData[];
  onSwipe: (cardId: string, favorite: boolean) => void;
  onComplete: () => void;
}

export const CardViewer = ({ cards, onSwipe, onComplete }: CardViewerProps) => {
  const [gone] = useState(() => new Set<number>());
  const [springs, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rot: 0,
  }));

  const currentIndex = cards.length - 1 - gone.size;
  const currentCard = cards[currentIndex];

  const bind = useDrag(
    ({ args: [index], down, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      const trigger = vx > 0.2;
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger) {
        gone.add(index);
        const favorite = dir === 1;
        onSwipe(cards[index].id, favorite);
        
        if (gone.size === cards.length) {
          setTimeout(onComplete, 300);
        }
      }

      api.start({
        x: down ? mx : gone.has(index) ? (200 + window.innerWidth) * dir : 0,
        rot: down ? mx / 100 + (down ? xDir * vx * 50 : 0) : 0,
        scale: down ? 1.1 : 1,
        config: { friction: 50, tension: down ? 800 : 500 },
      });
    },
    { filterTaps: true }
  );

  if (!currentCard) return null;

  const swipeIndicatorOpacity = to(springs.x, (x) => {
    const absX = Math.abs(x);
    return Math.min(absX / 100, 1);
  });

  const favoriteOpacity = to(springs.x, (x) => (x > 0 ? Math.min(x / 100, 1) : 0));
  const rejectOpacity = to(springs.x, (x) => (x < 0 ? Math.min(Math.abs(x) / 100, 1) : 0));

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Card stack background */}
      {currentIndex > 0 && (
        <div className="absolute">
          <PokemonCard
            card={cards[currentIndex - 1]}
            className="opacity-50 scale-95"
          />
        </div>
      )}

      {/* Current card */}
      <animated.div
        {...bind(currentIndex)}
        style={{
          x: springs.x,
          y: springs.y,
          scale: springs.scale,
          rotateZ: springs.rot,
          touchAction: 'none',
        }}
        className="absolute cursor-grab active:cursor-grabbing"
      >
        <PokemonCard card={currentCard} />

        {/* Swipe indicators */}
        <animated.div
          style={{ opacity: favoriteOpacity }}
          className="absolute top-8 right-8 bg-green-500 text-white p-4 rounded-full"
        >
          <Heart className="w-8 h-8" fill="currentColor" />
        </animated.div>

        <animated.div
          style={{ opacity: rejectOpacity }}
          className="absolute top-8 left-8 bg-red-500 text-white p-4 rounded-full"
        >
          <X className="w-8 h-8" />
        </animated.div>
      </animated.div>

      {/* Counter */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-6 py-3 rounded-full shadow-lg">
        <p className="text-sm font-semibold">
          {cards.length - gone.size} / {cards.length}
        </p>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm text-muted-foreground">Swipe right to favorite, left to skip</p>
      </div>
    </div>
  );
};
