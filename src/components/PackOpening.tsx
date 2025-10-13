import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';
import pokeballSvg from '@/assets/pokeball.svg';

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
      // add a shine sweep before it disappears
      .to(packRef.current, {
        boxShadow: '0 0 120px rgba(255,255,255,0.45)',
        duration: 0.2,
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
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 min-h-screen">
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Pack */}
        <div
          ref={packRef}
          className="w-64 h-80 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden"
        >
          <div className="text-center">
            <p className="text-xl font-bold text-white">Opening Pack...</p>
          </div>
          {/* shine overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="shine w-24 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transform -translate-x-1/2" />
          </div>
        </div>

        {/* Cards burst effect */}
        <div
          ref={cardsRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 scale-0 pointer-events-none"
        >
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
};
