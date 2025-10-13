import { useState, useEffect, useRef, useCallback } from 'react';
import Hammer from 'hammerjs';
import gsap from 'gsap';
import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Heart, ArrowLeft, ArrowRight, X } from 'lucide-react';

interface CardViewerProps {
  cards: CardData[];
  onSwipe: (cardId: string, favorite: boolean) => void;
  onComplete: () => void;
}

export const CardViewer = ({ cards, onSwipe, onComplete }: CardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLDivElement>(null);

  const currentCard = cards[currentIndex];

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
          scale: 1,
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

  const animateSkip = () => {
    if (skipRef.current) {
      gsap.fromTo(
        skipRef.current,
        {
          scale: 0,
          opacity: 0,
          rotation: 180,
        },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.4,
          ease: 'back.out(1.7)',
          onComplete: () => {
            gsap.to(skipRef.current, {
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

  const swipeCard = useCallback((direction: 'left' | 'right') => {
    if (isAnimating || !cardRef.current || !currentCard) return;
    
    setIsAnimating(true);
    const isFavorite = direction === 'left';

    if (isFavorite) {
      animateHeart();
    } else {
      animateSkip();
    }

    const xOffset = direction === 'left' ? -window.innerWidth : window.innerWidth;
    const rotation = direction === 'left' ? -45 : 45;

    gsap.to(cardRef.current, {
      x: xOffset,
      y: 0, // Ensure consistent exit position
      rotation: rotation,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        onSwipe(currentCard.id, isFavorite);
        
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          
          // Reset card to exact center position
          if (cardRef.current) {
            gsap.set(cardRef.current, {
              x: 0,
              y: 0, // Fixed: Always reset to center
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
  }, [isAnimating, currentCard, currentIndex, cards.length, onSwipe, onComplete]);

  // Hammer.js setup
  useEffect(() => {
    if (!cardRef.current) return;

    const hammer = new Hammer(cardRef.current);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 10 });

    hammer.on('panmove', (e) => {
      if (isAnimating || !cardRef.current) return;

      const deltaX = e.deltaX;
      // Limit vertical movement to prevent cards from appearing at wrong positions
      const deltaY = Math.max(-50, Math.min(50, e.deltaY));
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
  }, [currentIndex, isAnimating, cards.length, currentCard, swipeCard]);

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating, swipeCard]);

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

  // Prefetch next 2 images for smoothness
  useEffect(() => {
    const toPrefetch = [] as string[];
    if (cards[currentIndex + 1]) toPrefetch.push(cards[currentIndex + 1].card.images.small || cards[currentIndex + 1].card.images.large);
    if (cards[currentIndex + 2]) toPrefetch.push(cards[currentIndex + 2].card.images.small || cards[currentIndex + 2].card.images.large);
    toPrefetch.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [currentIndex, cards]);

  if (!currentCard) return null;

  return (
    <div ref={containerRef} className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Card area - top section */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {/* Card stack background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {currentIndex < cards.length - 1 && (
            <div className="opacity-30 scale-95 blur-sm transform translate-y-2">
              <PokemonCard card={cards[currentIndex + 1]} showBack />
            </div>
          )}
        </div>

        {/* Current card */}
        <div
          ref={cardRef}
          className="relative"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div style={{ backfaceVisibility: 'hidden' }}>
            <PokemonCard card={currentCard} showBack={false} />
          </div>
        </div>

        {/* Heart animation overlay */}
        <div
          ref={heartRef}
          className="absolute pointer-events-none"
          style={{ opacity: 0 }}
        >
          <Heart className="w-16 h-16 text-red-500 fill-red-500 drop-shadow-2xl" />
        </div>

        {/* Skip animation overlay */}
        <div
          ref={skipRef}
          className="absolute pointer-events-none"
          style={{ opacity: 0 }}
        >
          <X className="w-16 h-16 text-gray-500 drop-shadow-2xl" />
        </div>
      </div>

      {/* Controls area - bottom section */}
      <div className="pb-8 pt-4 flex flex-col items-center gap-4">
        {/* Navigation row: Left arrow, Counter, Right arrow */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => swipeCard('left')}
            disabled={isAnimating}
            className="p-3 rounded-full bg-card/90 backdrop-blur border border-border hover:bg-card/100 transition-colors disabled:opacity-50"
            aria-label="Favorite (swipe left)"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="bg-card/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-border min-w-[100px] text-center">
            <p className="text-sm font-semibold">
              {currentIndex + 1} / {cards.length}
            </p>
          </div>

          <button
            onClick={() => swipeCard('right')}
            disabled={isAnimating}
            className="p-3 rounded-full bg-card/90 backdrop-blur border border-border hover:bg-card/100 transition-colors disabled:opacity-50"
            aria-label="Skip (swipe right)"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
