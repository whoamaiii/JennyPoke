import { useState, useEffect, useRef } from 'react';
import Hammer from 'hammerjs';
import gsap from 'gsap';
import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react';

interface CardViewerProps {
  cards: CardData[];
  onSwipe: (cardId: string, favorite: boolean) => void;
  onComplete: () => void;
}

export const CardViewer = ({ cards, onSwipe, onComplete }: CardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);

  const currentCard = cards[currentIndex];
  const isFlipped = flippedCards.has(currentIndex);

  const animateHeart = () => {
    if (heartRef.current) {
      gsap.fromTo(
        heartRef.current,
        {
          scale: 0,
          opacity: 0,
          rotation: -180,
        },
        {
          scale: 1.5,
          opacity: 1,
          rotation: 0,
          duration: 0.4,
          ease: 'back.out(1.7)',
          onComplete: () => {
            gsap.to(heartRef.current, {
              scale: 0,
              opacity: 0,
              duration: 0.3,
              delay: 0.2,
            });
          },
        }
      );
    }
  };

  const swipeCard = (direction: 'left' | 'right') => {
    if (isAnimating || !cardRef.current || !currentCard) return;
    
    setIsAnimating(true);
    const isFavorite = direction === 'left';

    if (isFavorite) {
      animateHeart();
    }

    const xOffset = direction === 'left' ? -window.innerWidth : window.innerWidth;
    const rotation = direction === 'left' ? -45 : 45;

    gsap.to(cardRef.current, {
      x: xOffset,
      rotation: rotation,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        onSwipe(currentCard.id, isFavorite);
        
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          
          // Reset card position
          if (cardRef.current) {
            gsap.set(cardRef.current, {
              x: 0,
              rotation: 0,
              opacity: 1,
            });
          }
          setIsAnimating(false);
        } else {
          // All cards swiped
          setTimeout(onComplete, 300);
        }
      },
    });
  };

  const toggleFlip = () => {
    if (isAnimating) return;
    
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotationY: isFlipped ? 0 : 180,
        duration: 0.6,
        ease: 'power2.inOut',
      });
    }
  };

  // Hammer.js setup
  useEffect(() => {
    if (!cardRef.current) return;

    const hammer = new Hammer(cardRef.current);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 10 });

    hammer.on('panmove', (e) => {
      if (isAnimating || !cardRef.current) return;

      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      const rotation = deltaX / 20;

      gsap.set(cardRef.current, {
        x: deltaX,
        y: deltaY,
        rotation: rotation,
      });
    });

    hammer.on('panend', (e) => {
      if (isAnimating || !cardRef.current) return;

      const deltaX = e.deltaX;
      const velocityX = e.velocityX;

      // Check if swipe was strong enough
      if (Math.abs(deltaX) > 150 || Math.abs(velocityX) > 0.5) {
        if (deltaX < 0) {
          swipeCard('left');
        } else {
          swipeCard('right');
        }
      } else {
        // Reset card position
        gsap.to(cardRef.current, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    });

    return () => {
      hammer.destroy();
    };
  }, [currentIndex, isAnimating, cards.length, currentCard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          swipeCard('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          swipeCard('right');
          break;
        case ' ':
          e.preventDefault();
          toggleFlip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating, isFlipped]);

  // Card enter animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' }
      );
    }
  }, [currentIndex]);

  if (!currentCard) return null;

  return (
    <div ref={containerRef} className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Card stack background */}
      <div className="absolute">
        {currentIndex < cards.length - 1 && (
          <div className="opacity-30 scale-95 blur-sm">
            <PokemonCard card={cards[currentIndex + 1]} showBack />
          </div>
        )}
      </div>

      {/* Current card */}
      <div
        ref={cardRef}
        className="relative cursor-grab active:cursor-grabbing"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        <div style={{ backfaceVisibility: 'hidden' }}>
          <PokemonCard card={currentCard} showBack={isFlipped} />
        </div>
      </div>

      {/* Heart animation overlay */}
      <div
        ref={heartRef}
        className="absolute pointer-events-none"
        style={{ opacity: 0 }}
      >
        <Heart className="w-32 h-32 text-pokemon-red fill-pokemon-red drop-shadow-2xl" />
      </div>

      {/* Counter */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-border">
        <p className="text-sm font-semibold">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            <span>Favorite</span>
          </div>
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-full">
            <ArrowRight className="w-4 h-4" />
            <span>Skip</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground bg-card/80 backdrop-blur px-4 py-2 rounded-full">
          Press SPACE to flip card
        </p>
      </div>
    </div>
  );
};
