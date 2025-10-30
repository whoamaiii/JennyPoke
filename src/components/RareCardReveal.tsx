import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { CardData } from '@/types/pokemon';
import { HolographicPokemonCard } from './HolographicPokemonCard';
import { audioManager } from '@/lib/audioManager';
import { Sparkles } from 'lucide-react';

interface RareCardRevealProps {
  card: CardData;
  onComplete: () => void;
  duration?: number;
}

export const RareCardReveal = ({
  card,
  onComplete,
  duration = 3000
}: RareCardRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 500);
      }
    });

    // Play special rare sound
    audioManager.play('rare-chime');

    // Fade in container
    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    // Spotlight effect - start small and expand
    tl.fromTo(
      spotlightRef.current,
      {
        scale: 0,
        opacity: 0,
      },
      {
        scale: 2,
        opacity: 0.8,
        duration: 0.8,
        ease: 'power2.out',
      },
      '-=0.1'
    );

    // Light rays spinning
    tl.to(
      raysRef.current,
      {
        rotation: 360,
        duration: duration / 1000,
        ease: 'linear',
        repeat: -1,
      },
      '<'
    );

    // Card entrance - from above with rotation
    tl.fromTo(
      cardRef.current,
      {
        y: -200,
        scale: 0.5,
        rotation: -180,
        opacity: 0,
      },
      {
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'back.out(1.7)',
        onStart: () => {
          // Gold confetti burst
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.4 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493'],
            startVelocity: 45,
            gravity: 1,
            ticks: 400,
          });
        },
      },
      '-=0.6'
    );

    // Continuous sparkle particles
    const sparkleInterval = setInterval(() => {
      confetti({
        particleCount: 5,
        angle: 90,
        spread: 360,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500'],
        startVelocity: 20,
        gravity: 0.5,
        ticks: 200,
        shapes: ['circle'],
      });
      audioManager.play('sparkle');
    }, 300);

    setTimeout(() => {
      clearInterval(sparkleInterval);
    }, duration);

    // Pulse the card gently
    tl.to(
      cardRef.current,
      {
        scale: 1.05,
        duration: 0.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: Math.floor(duration / 1600),
      },
      '-=0.5'
    );

    // Fade out everything before completion
    tl.to(
      [containerRef.current],
      {
        opacity: 0,
        duration: 0.5,
      },
      `+=${(duration / 1000) - 1}`
    );

    return () => {
      clearInterval(sparkleInterval);
      tl.kill();
    };
  }, [card, onComplete, duration]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)',
      }}
    >
      {/* Spotlight effect */}
      <div
        ref={spotlightRef}
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Spinning light rays */}
      <div
        ref={raysRef}
        className="absolute pointer-events-none"
        style={{
          width: '800px',
          height: '800px',
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="100"
              x2="100"
              y2="0"
              stroke="rgba(255, 215, 0, 0.2)"
              strokeWidth="2"
              transform={`rotate(${i * 45} 100 100)`}
            />
          ))}
        </svg>
      </div>

      {/* Special text */}
      <div className="absolute top-1/4 text-center animate-pulse">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
            Rare Card!
          </h2>
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </div>
        <p className="text-yellow-200 text-lg">Something special was found...</p>
      </div>

      {/* The card with enhanced holographic effect */}
      <div
        ref={cardRef}
        className="relative z-10"
        style={{
          filter: 'drop-shadow(0 0 40px rgba(255, 215, 0, 0.6))',
        }}
      >
        <HolographicPokemonCard
          card={card}
          size="large"
          enableHolographic={true}
        />
      </div>

      {/* Particle ring effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * 360;
          const radius = 300;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <div
              key={i}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.6,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
