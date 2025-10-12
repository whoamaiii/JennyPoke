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
  const [availableHeight, setAvailableHeight] = useState<number>(window.innerHeight);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLDivElement>(null);

  const currentCard = cards[currentIndex];

  // 🧭 1. Measure available space dynamically (account for navbar, etc.)
  useEffect(() => {
    const updateHeight = () => {
      const navbar = document.querySelector('nav');
      const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
      setAvailableHeight(window.innerHeight - navHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // ❤️ Animation functions
  const animateHeart = () => {
    if (!heartRef.current) return;
    gsap.fromTo(
      heartRef.current,
      { scale: 0, opacity: 0, rotation: -180 },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.4,
        ease: 'back.out(1.7)',
        onComplete: () =>
          gsap.to(heartRef.current, { scale: 0, opacity: 0, duration: 0.3, delay: 0.2 }),
      }
    );
  };

  const animateSkip = () => {
    if (!skipRef.current) return;
    gsap.fromTo(
      skipRef.current,
      { scale: 0, opacity: 0, rotation: 180 },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.4,
        ease: 'back.out(1.7)',
        onComplete: () =>
          gsap.to(skipRef.current, { scale: 0, opacity: 0, duration: 0.3, delay: 0.2 }),
      }
    );
  };

  // 🃏 Swipe logic
  const swipeCard = useCallback(
    (direction: 'left' | 'right') => {
      if (isAnimating || !cardRef.current || !currentCard) return;

      setIsAnimating(true);
      const isFavorite = direction === 'left';
      if (isFavorite) animateHeart();
      else animateSkip();

      const xOffset = direction === 'left' ? -window.innerWidth : window.innerWidth;
      const rotation = direction === 'left' ? -45 : 45;

      gsap.to(cardRef.current, {
        x: xOffset,
        rotation,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          onSwipe(currentCard.id, isFavorite);
          if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            gsap.set(cardRef.current, { x: 0, rotation: 0, opacity: 1 });
            setIsAnimating(false);
          } else {
            setTimeout(onComplete, 300);
          }
        },
      });
    },
    [isAnimating, currentCard, currentIndex, cards.length, onSwipe, onComplete]
  );

  // 🧠 Hammer.js gestures
  useEffect(() => {
    if (!cardRef.current) return;
    const hammer = new Hammer(cardRef.current);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 10 });

    hammer.on('panmove', (e) => {
      if (isAnimating || !cardRef.current) return;
      const { deltaX, deltaY } = e;
      const rotation = deltaX / 20;
      gsap.set(cardRef.current, { x: deltaX, y: deltaY, rotation });
    });

    hammer.on('panend', (e) => {
      if (isAnimating || !cardRef.current) return;
      const { deltaX, velocityX } = e;
      if (Math.abs(deltaX) > 150 || Math.abs(velocityX) > 0.5) {
        swipeCard(deltaX < 0 ? 'left' : 'right');
      } else {
        gsap.to(cardRef.current, { x: 0, y: 0, rotation: 0, duration: 0.3, ease: 'power2.out' });
      }
    });

    return () => hammer.destroy();
  }, [currentIndex, isAnimating, swipeCard]);

  // ⌨️ Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isAnimating) return;
      if (e.key === 'ArrowLeft') swipeCard('left');
      if (e.key === 'ArrowRight') swipeCard('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAnimating, swipeCard]);

  // ✨ Entry animation
  useEffect(() => {
    if (cardRef.current)
      gsap.fromTo(cardRef.current, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' });
  }, [currentIndex]);

  // 🖼️ Prefetch
  useEffect(() => {
    const prefetch = (i: number) => {
      if (!cards[i]) return;
      const src = cards[i].card.images.large || cards[i].card.images.small;
      const img = new Image();
      img.src = src;
    };
    prefetch(currentIndex + 1);
    prefetch(currentIndex + 2);
  }, [currentIndex, cards]);

  if (!currentCard) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col items-center justify-between overflow-hidden"
      style={{ height: availableHeight }}
    >
      {/* Card stack background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {currentIndex < cards.length - 1 && (
          <div className="opacity-30 scale-95 blur-sm transform translate-y-2">
            <PokemonCard card={cards[currentIndex + 1]} showBack />
          </div>
        )}
      </div>

      {/* Centered current card */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={cardRef}
          className="relative"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div style={{ backfaceVisibility: 'hidden' }}>
            <PokemonCard card={currentCard} />
          </div>
        </div>
      </div>

      {/* Heart & skip overlay */}
      <div ref={heartRef} className="absolute pointer-events-none" style={{ opacity: 0 }}>
        <Heart className="w-16 h-16 text-red-500 fill-red-500 drop-shadow-2xl" />
      </div>
      <div ref={skipRef} className="absolute pointer-events-none" style={{ opacity: 0 }}>
        <X className="w-16 h-16 text-gray-500 drop-shadow-2xl" />
      </div>

      {/* Instructions & counter area */}
      <div className="w-full flex flex-col items-center gap-4 pb-8">
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

        <div className="bg-card/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-border">
          <p className="text-sm font-semibold">
            {currentIndex + 1} / {cards.length}
          </p>
        </div>
      </div>
    </div>
  );
};
