import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';

interface PackOpeningProps {
  onComplete: () => void;
}

export const PackOpening = ({ onComplete }: PackOpeningProps) => {
  const packRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 500);
      },
    });

    // Pack shake and open animation
    tl.to(packRef.current, {
      rotation: -10,
      duration: 0.1,
      repeat: 5,
      yoyo: true,
    })
      .to(packRef.current, {
        scale: 1.2,
        duration: 0.3,
      })
      .to(packRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
      })
      .to(
        cardsRef.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
        },
        '-=0.3'
      );
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative">
        {/* Pack */}
        <div
          ref={packRef}
          className="w-64 h-80 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl shadow-2xl flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🎴</div>
            <p className="text-xl font-bold text-white">Opening Pack...</p>
          </div>
        </div>

        {/* Cards burst effect */}
        <div
          ref={cardsRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 scale-0"
        >
          <div className="relative">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute w-16 h-24 bg-card rounded-lg shadow-lg"
                style={{
                  transform: `rotate(${i * 36}deg) translateY(-100px)`,
                }}
              />
            ))}
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};
