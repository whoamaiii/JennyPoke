import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hammer from 'hammerjs';
import gsap from 'gsap';
import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Heart, X } from 'lucide-react';

interface CardViewerProps {
  cards: CardData[];
  onSwipe: (cardId: string, favorite: boolean) => void;
  onComplete: () => void;
}

export const CardViewer = ({ cards, onSwipe, onComplete }: CardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
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

  const handleCardReveal = () => {
    if (isAnimating) return;
    
    try {
      // Toggle the revealed state
      setIsRevealed(!isRevealed);
      
      // Add a subtle flip animation
      if (cardRef.current) {
        gsap.fromTo(cardRef.current, 
          { scale: 0.95, opacity: 0.8 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    } catch (error) {
      console.error('Error flipping card:', error);
      // Prevent UI from getting stuck if there's an error
      setIsAnimating(false);
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

    // Mobile-optimized values
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 768;
    const xOffset = direction === 'left' ? -viewportWidth : viewportWidth;
    const rotation = direction === 'left' ? (isMobile ? -30 : -45) : (isMobile ? 30 : 45);

    gsap.to(cardRef.current, {
      x: xOffset,
      y: 0,
      rotation: rotation,
      opacity: 0,
      duration: isMobile ? 0.3 : 0.5,
      ease: 'power2.in',
      onComplete: () => {
        onSwipe(currentCard.id, isFavorite);

        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setIsRevealed(false);

          // Reset card to exact center position immediately
          if (cardRef.current) {
            gsap.set(cardRef.current, {
              x: 0,
              y: 0,
              rotation: 0,
              opacity: 1,
              clearProps: 'all', // Clear all GSAP properties to ensure clean slate
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

  // Hammer.js setup with mouse and touch support
  useEffect(() => {
    if (!cardRef.current) return;

    // Enable both touch and mouse input
    const hammer = new Hammer(cardRef.current, {
      inputClass: Hammer.TouchMouseInput,
    });
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 10 });

    hammer.on('panmove', (e) => {
      if (isAnimating || !cardRef.current) return;

      const deltaX = e.deltaX;
      // Limit vertical movement to prevent cards from appearing at wrong positions
      const deltaY = Math.max(-50, Math.min(50, e.deltaY));
      const isMobile = window.innerWidth < 768;
      const rotation = deltaX / (isMobile ? 15 : 20); // More responsive rotation on mobile

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
      const isMobile = window.innerWidth < 768;
      
      // Mobile-optimized swipe thresholds
      const swipeThreshold = isMobile ? 100 : 150;
      const velocityThreshold = isMobile ? 0.3 : 0.5;

      // Check if swipe was strong enough
      if (Math.abs(deltaX) > swipeThreshold || Math.abs(velocityX) > velocityThreshold) {
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
          duration: isMobile ? 0.2 : 0.3,
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
          swipeCard('left'); // Heart/favorite
          break;
        case 'ArrowRight':
          e.preventDefault();
          swipeCard('right'); // X/dismiss
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
    // Reset revealed state for new card
    setIsRevealed(false);
  }, [currentIndex]);

  // Prefetch next 2 images for smoothness
  useEffect(() => {
    // Safety check for cards array and valid card data
    if (!cards || !Array.isArray(cards)) return;
    
    const toPrefetch = [] as string[];
    
    // Check for next card and ensure it has valid image data
    if (cards[currentIndex + 1] && cards[currentIndex + 1].card && cards[currentIndex + 1].card.images) {
      const nextCardImage = cards[currentIndex + 1].card.images.small || cards[currentIndex + 1].card.images.large;
      if (nextCardImage) toPrefetch.push(nextCardImage);
    }
    
    // Check for card after next and ensure it has valid image data
    if (cards[currentIndex + 2] && cards[currentIndex + 2].card && cards[currentIndex + 2].card.images) {
      const nextNextCardImage = cards[currentIndex + 2].card.images.small || cards[currentIndex + 2].card.images.large;
      if (nextNextCardImage) toPrefetch.push(nextNextCardImage);
    }
    
    // Only prefetch if we have valid image URLs
    if (toPrefetch.length > 0) {
      toPrefetch.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [currentIndex, cards]);

  if (!currentCard) return null;

  return (
    <div ref={containerRef} className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Card area - top section */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {/* Card stack background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {currentIndex < cards.length - 1 && cards[currentIndex + 1] && cards[currentIndex + 1].card ? (
            <div className="opacity-30 scale-95 blur-sm transform translate-y-2">
              <PokemonCard card={cards[currentIndex + 1]} showBack />
            </div>
          ) : null}
        </div>

        {/* Current card */}
        <div
          ref={cardRef}
          className="relative cursor-grab active:cursor-grabbing select-none"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
          onClick={handleCardReveal}
        >
          {!isRevealed ? (
            // Show actual Pokemon card back - same size as normal card
            <div style={{ backfaceVisibility: 'hidden' }}>
              <PokemonCard card={currentCard} showBack={true} />
            </div>
          ) : currentCard?.card?.images ? (
            // Show actual card after reveal - with validation to prevent errors
            <div style={{ backfaceVisibility: 'hidden' }}>
              <PokemonCard card={currentCard} showBack={false} />
            </div>
          ) : (
            // Fallback if card data is incomplete
            <div style={{ backfaceVisibility: 'hidden' }}>
              <PokemonCard card={currentCard} showBack={true} />
            </div>
          )}
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

      {/* Controls area - positioned directly below card */}
      <div className="flex flex-col items-center gap-4 pb-8">
        {/* Tap to reveal/hide instruction - above buttons with fixed height to prevent layout shift */}
        <div className="h-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-fade-in">
            {isRevealed ? 'Tap the card to hide it' : 'Tap the card to reveal it'}
          </p>
        </div>
        
        {/* Navigation row: Heart, Counter, X */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => swipeCard('left')}
            disabled={isAnimating}
            className="p-3 rounded-full bg-card/90 backdrop-blur border border-border hover:bg-card/100 transition-colors disabled:opacity-50"
            aria-label="Favorite (swipe left)"
          >
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
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
            aria-label="Dismiss (swipe right)"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
