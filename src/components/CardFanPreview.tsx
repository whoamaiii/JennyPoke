import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CardData } from '@/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface CardFanPreviewProps {
  cards: CardData[];
  onComplete: () => void;
  duration?: number;
}

export const CardFanPreview = ({
  cards,
  onComplete,
  duration = 2000
}: CardFanPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // Calculate fan layout
    const cardCount = cards.length;
    const maxRotation = Math.min(40, cardCount * 5); // Max 40 degrees spread
    const rotationStep = cardCount > 1 ? (maxRotation * 2) / (cardCount - 1) : 0;
    const startRotation = -maxRotation;

    // Animate each card into fan position
    cardsRef.current.forEach((cardEl, index) => {
      if (!cardEl) return;

      const rotation = startRotation + (rotationStep * index);
      const yOffset = Math.abs(rotation) * 0.5; // Cards in center are lower
      const zIndex = index;
      const scale = 0.7; // Smaller for preview

      // Start from center, stacked
      gsap.set(cardEl, {
        x: 0,
        y: 50,
        rotation: 0,
        scale: 0,
        opacity: 0,
        zIndex,
      });

      // Animate to fan position
      tl.to(
        cardEl,
        {
          x: rotation * 2, // Spread cards horizontally
          y: yOffset,
          rotation,
          scale,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        },
        index * 0.08 // Stagger each card
      );
    });

    // Highlight rare cards with glow
    tl.to(
      cardsRef.current.filter((_, idx) =>
        ['rare', 'ultra-rare'].includes(cards[idx]?.rarity)
      ),
      {
        filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
        duration: 0.3,
        yoyo: true,
        repeat: 3,
      },
      '+=0.2'
    );

    // Show continue button
    tl.fromTo(
      buttonRef.current,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
      },
      '-=0.3'
    );

    // Auto-advance after duration
    const autoAdvanceTimer = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(autoAdvanceTimer);
      tl.kill();
    };
  }, [cards, onComplete, duration]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 overflow-hidden"
    >
      {/* Title */}
      <div className="absolute top-20 text-center">
        <h2 className="text-3xl font-bold mb-2">Your Pack!</h2>
        <p className="text-muted-foreground">
          {cards.length} cards awaiting reveal
        </p>
      </div>

      {/* Card fan */}
      <div className="relative flex items-center justify-center w-full h-full">
        <div className="relative" style={{ width: '600px', height: '400px' }}>
          {cards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => (cardsRef.current[index] = el)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                transformOrigin: 'center bottom',
              }}
            >
              <PokemonCard
                card={card}
                size="small"
                showBack={true}
                enableTilt={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="absolute bottom-20">
        <Button
          ref={buttonRef}
          onClick={handleSkip}
          size="lg"
          className="opacity-0"
        >
          Start Revealing
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>

      {/* Tap anywhere hint (mobile) */}
      <p className="absolute bottom-10 text-xs text-muted-foreground md:hidden">
        Tap anywhere to continue
      </p>

      {/* Click anywhere to continue (desktop) */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleSkip}
        style={{ zIndex: -1 }}
      />
    </div>
  );
};
