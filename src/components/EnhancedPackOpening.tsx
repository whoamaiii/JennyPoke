import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { Loader2 } from 'lucide-react';
import { audioManager } from '@/lib/audioManager';
import { hapticManager } from '@/lib/haptics';

export type AnimationSpeed = 'fast' | 'normal' | 'cinematic';
export type PackDesign = 'standard' | 'premium' | 'ultra' | 'mystery';

interface EnhancedPackOpeningProps {
  onComplete: () => void;
  packDesign?: PackDesign;
  hasRareCard?: boolean;
  hasUltraRare?: boolean;
  guaranteedRare?: boolean;
  animationSpeed?: AnimationSpeed;
  cardCount?: number;
}

type AnimationPhase = 'anticipation' | 'shake' | 'burst' | 'reveal';

export const EnhancedPackOpening = ({
  onComplete,
  packDesign = 'standard',
  hasRareCard = false,
  hasUltraRare = false,
  guaranteedRare = false,
  animationSpeed = 'normal',
  cardCount = 8
}: EnhancedPackOpeningProps) => {
  const packRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const energyRingsRef = useRef<(HTMLDivElement | null)[]>([]);
  const foilFlashRef = useRef<(HTMLDivElement | null)[]>([]);
  const tearFragmentsRef = useRef<HTMLDivElement>(null);
  const cardShuffleRef = useRef<(HTMLDivElement | null)[]>([]);
  const [phase, setPhase] = useState<AnimationPhase>('anticipation');
  const [isSkipping, setIsSkipping] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Speed multipliers (optimized for snappier feel)
  const speedMultiplier = {
    fast: 2.0,      // Faster for impatient users
    normal: 1.3,    // Slightly faster default (was 1.0)
    cinematic: 0.75
  }[animationSpeed];

  // Pack design classes
  const packDesignClasses = {
    standard: 'bg-gradient-to-br from-primary via-secondary to-accent',
    premium: 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500',
    ultra: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500',
    mystery: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-black'
  };

  // Rarity glow colors - more intense for ultra-rare
  const rarityGlow = hasUltraRare
    ? '0 0 120px rgba(255, 0, 255, 0.8), 0 0 200px rgba(255, 100, 255, 0.6), 0 0 300px rgba(255, 200, 255, 0.4)'
    : hasRareCard
    ? '0 0 80px rgba(255, 215, 0, 0.6), 0 0 120px rgba(255, 215, 0, 0.4)'
    : '0 0 40px rgba(255, 255, 255, 0.3)';

  // Skip animation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSkipping) {
        setIsSkipping(true);
        if (timelineRef.current) {
          timelineRef.current.timeScale(5); // 5x speed
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSkipping) {
        setIsSkipping(false);
        if (timelineRef.current) {
          timelineRef.current.timeScale(1 / speedMultiplier); // Back to normal
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSkipping, speedMultiplier]);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 500 / speedMultiplier);
      },
    });

    timelineRef.current = tl;

    // Darken background for cinematic effect
    if (backgroundRef.current) {
      tl.to(backgroundRef.current, {
        opacity: 0.95,
        duration: 0.8 / speedMultiplier,
        ease: 'power2.out'
      }, 0);
    }

    // ====== PHASE 1: ANTICIPATION (1.5s) ======
    setPhase('anticipation');

    // Start anticipation sound
    audioManager.fadeIn('anticipation', 500 / speedMultiplier);

    // Pulse and glow
    tl.to(packRef.current, {
      scale: 1.05,
      boxShadow: rarityGlow,
      duration: 0.4 / speedMultiplier,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // Fade out anticipation sound
        audioManager.fadeOut('anticipation', 500 / speedMultiplier);
      }
    });

    // Energy ring expansion
    if (energyRingsRef.current.length > 0) {
      energyRingsRef.current.forEach((ring, i) => {
        if (!ring) return;

        tl.fromTo(ring, {
          width: 100,
          height: 100,
          opacity: 0.8,
        }, {
          width: 400,
          height: 400,
          opacity: 0,
          duration: 1.0 / speedMultiplier,
          ease: 'power2.out',
          onStart: () => {
            if (i === 0 && hasRareCard) {
              audioManager.play('sparkle');
            }
          }
        }, `<+=${i * 0.2 / speedMultiplier}`);
      });
    }

    // Foil flash effects during anticipation
    if (foilFlashRef.current.length > 0 && (hasRareCard || hasUltraRare)) {
      const flashDelay = 0.15 / speedMultiplier;
      const flashColors = hasUltraRare
        ? ['#FF00FF', '#9400D3', '#FFD700', '#00FFFF']
        : ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'];

      foilFlashRef.current.forEach((flash, i) => {
        if (!flash) return;

        const randomDelay = Math.random() * 0.3 / speedMultiplier;
        const color = flashColors[i % flashColors.length];

        tl.to(flash, {
          opacity: 0.9,
          scale: 1.5,
          duration: 0.15 / speedMultiplier,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          onStart: () => {
            // Set flash color
            if (flash) {
              flash.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
            }
            if (i === 0) {
              audioManager.play('sparkle');
            }
          }
        }, `+=${randomDelay + (i * flashDelay)}`);
      });
    }

    // Bounce
    tl.to(packRef.current, {
      y: -20,
      duration: 0.3 / speedMultiplier,
      ease: 'power1.out',
    }).to(packRef.current, {
      y: 0,
      duration: 0.3 / speedMultiplier,
      ease: 'bounce.out',
    });

    // ====== PHASE 2: SHAKE (1.2s) ======
    setPhase('shake');

    // Enhanced shake with 3D rotation - intensity based on rarity
    const shakeIntensity = hasUltraRare ? 20 : hasRareCard ? 15 : 10;
    const shakeRotateY = hasUltraRare ? -20 : -15;
    const shakeRotateX = hasUltraRare ? -15 : -10;
    const shakeRepeats = hasUltraRare ? 12 : hasRareCard ? 8 : 5;

    tl.to(packRef.current, {
      rotation: -shakeIntensity,
      rotateY: shakeRotateY,
      rotateX: shakeRotateX,
      duration: 0.1 / speedMultiplier,
      repeat: shakeRepeats,
      yoyo: true,
      onStart: () => {
        // Start pack rustle sound
        audioManager.play('pack-rustle');

        // Haptic feedback for shake start
        hapticManager.vibrate(hasUltraRare ? 'heavy' : hasRareCard ? 'medium' : 'light');

        // Sparkles during shake with sound (optimized - fewer particles)
        const sparkleInterval = setInterval(() => {
          confetti({
            particleCount: 2,  // Reduced from 3
            startVelocity: 10,
            spread: 360,
            origin: {
              x: 0.5,
              y: 0.5
            },
            colors: hasRareCard
              ? ['#FFD700', '#FFA500', '#FF6347']
              : ['#FFFFFF', '#E0E0E0']
          });

          // Play sparkle sound for rare cards (less frequently)
          if (hasRareCard && Math.random() > 0.5) {
            audioManager.play('sparkle');
          }
        }, 150 / speedMultiplier);  // Less frequent (was 100ms)

        setTimeout(() => {
          clearInterval(sparkleInterval);
          audioManager.stop('pack-rustle');
        }, 1200 / speedMultiplier);
      }
    });

    // Screen shake effect
    if (containerRef.current) {
      tl.to(containerRef.current, {
        x: '+=2',
        duration: 0.05 / speedMultiplier,
        repeat: 10,
        yoyo: true,
      }, '<');
    }

    // ====== PHASE 3: BURST (0.8s) ======
    setPhase('burst');

    // Pack scales up dramatically
    tl.to(packRef.current, {
      scale: 1.3,
      rotateY: 0,
      rotateX: 0,
      rotation: 0,
      duration: 0.2 / speedMultiplier,
      ease: 'back.out(2)',
    });

    // Pack tear effect
    if (tearFragmentsRef.current) {
      const fragments = tearFragmentsRef.current.querySelectorAll('.tear-fragment');

      tl.to(tearFragmentsRef.current, {
        opacity: 1,
        duration: 0.1 / speedMultiplier,
      });

      // Animate each fragment outward
      fragments.forEach((fragment, i) => {
        const angle = (i / fragments.length) * 360;
        const distance = 150 + Math.random() * 100;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;

        tl.to(fragment, {
          x,
          y,
          rotation: Math.random() * 360,
          opacity: 0,
          duration: 0.4 / speedMultiplier,
          ease: 'power2.out',
        }, '<');
      });

      // Play tear sound (reuse pack-rip)
      audioManager.play('pack-rip');
    }

    // Intense glow sweep
    tl.to(packRef.current, {
      boxShadow: '0 0 200px rgba(255,255,255,0.9)',
      duration: 0.15 / speedMultiplier,
    });

    // Pack explodes with particles
    tl.to(packRef.current, {
      scale: 0,
      opacity: 0,
      rotateZ: 180,
      duration: 0.4 / speedMultiplier,
      ease: 'power4.in',
      onStart: () => {
        // Haptic feedback for burst
        hapticManager.vibrate(hasUltraRare ? [40, 100, 40] : hasRareCard ? [30, 80, 30] : 'medium');

        // Pack rip sound
        audioManager.play('pack-rip');

        // Rare card chime (slightly delayed for dramatic effect)
        if (hasRareCard) {
          setTimeout(() => {
            audioManager.play('rare-chime');
            // Haptic feedback for rare reveal
            hapticManager.vibrate('success');
          }, 300 / speedMultiplier);
        }

        // Main burst explosion (OPTIMIZED - fewer particles for performance)
        confetti({
          particleCount: hasUltraRare ? 120 : hasRareCard ? 100 : 70,  // Reduced from 250/150
          spread: 120,
          startVelocity: 60,
          origin: { y: 0.5 },
          colors: hasUltraRare
            ? ['#FF00FF', '#9400D3', '#FFD700', '#FF1493']  // Purple/rainbow for ultra-rare
            : hasRareCard
            ? ['#FFD700', '#FFA500', '#FF6347']  // Gold for rare
            : ['#4A90E2', '#50C878', '#FFD700'],  // Blue/green for common
          shapes: ['circle', 'square'],
          gravity: 1.2,
          drift: 0.3,  // Reduced drift for performance
          ticks: 250  // Fewer ticks (was 300)
        });

        // Light ray effect (secondary burst) - only for rare cards
        if (hasRareCard) {
          setTimeout(() => {
            confetti({
              particleCount: 30,  // Reduced from 50
              angle: 90,
              spread: 360,
              startVelocity: 45,
              origin: { y: 0.5 },
              colors: ['#FFFFFF', '#FFFFAA'],
              shapes: ['line'],
              ticks: 80  // Reduced from 100
            });
          }, 100 / speedMultiplier);
        }
      }
    });

    // ====== PHASE 4: REVEAL (0.5s) ======
    setPhase('reveal');

    // Card shuffle preview animation
    if (cardShuffleRef.current.length > 0) {
      const shuffleDelay = 0.05 / speedMultiplier;

      // Fan out cards quickly
      cardShuffleRef.current.forEach((card, i) => {
        if (!card) return;

        const totalCards = cardShuffleRef.current.length;
        const spreadAngle = 15; // degrees per card
        const rotation = ((i - totalCards / 2) * spreadAngle);
        const yOffset = Math.abs(i - totalCards / 2) * -5;

        tl.to(card, {
          opacity: 0.6,
          rotation,
          y: yOffset,
          x: rotation * 3, // Slight horizontal spread
          duration: 0.15 / speedMultiplier,
          ease: 'power2.out',
        }, `-=${0.1 / speedMultiplier}`);
      });

      // Play card shuffle sound
      audioManager.play('card-whoosh');

      // Collapse cards back
      tl.to(cardShuffleRef.current, {
        opacity: 0,
        scale: 0,
        duration: 0.2 / speedMultiplier,
        ease: 'power2.in',
        stagger: shuffleDelay,
      }, `+=${0.3 / speedMultiplier}`);
    }

    // Cards burst in
    tl.to(
      cardsRef.current,
      {
        scale: 1,
        opacity: 1,
        duration: 0.5 / speedMultiplier,
        ease: 'back.out(1.7)',
        onStart: () => {
          // Card whoosh sound as they appear
          audioManager.play('card-whoosh');
        }
      },
      '-=0.2'
    );

  }, [onComplete, hasRareCard, hasUltraRare, guaranteedRare, packDesign, speedMultiplier, rarityGlow]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden">
      {/* Background darkening overlay */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 bg-black/80 z-0 opacity-0"
      />

      <div
        ref={containerRef}
        className="relative flex flex-col items-center justify-center w-full h-full max-h-screen z-10"
      >
        {/* Anticipation Text */}
        {phase === 'anticipation' && (
          <div className="absolute top-1/3 text-center animate-pulse z-20">
            <p className="text-2xl md:text-3xl font-bold text-primary drop-shadow-lg">
              {hasUltraRare
                ? '🌟 ULTRA RARE INCOMING! 🌟'
                : hasRareCard
                ? '✨ Something special inside... ✨'
                : guaranteedRare
                ? '⭐ Rare Guaranteed! ⭐'
                : 'Get ready...'}
            </p>
          </div>
        )}

        {/* Energy rings */}
        <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center z-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              ref={(el) => { if (el) energyRingsRef.current[i] = el; }}
              className="energy-ring absolute rounded-full opacity-0"
              style={{
                border: `3px solid ${hasUltraRare ? '#FF00FF' : hasRareCard ? '#FFD700' : '#4A90E2'}`,
              }}
            />
          ))}
        </div>

        {/* Pack with 3D perspective */}
        <div
          ref={packRef}
          className={`w-64 h-80 ${packDesignClasses[packDesign]} rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden`}
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
        >
          <div className="text-center z-10">
            <p className="text-xl font-bold text-white drop-shadow-lg">
              {phase === 'shake' ? 'Opening...' : 'Pokemon Pack'}
            </p>
            <p className="text-sm text-white/80 mt-2">
              {cardCount} Cards
            </p>
            {guaranteedRare && phase === 'anticipation' && (
              <div className="mt-2 px-3 py-1 bg-yellow-500/30 rounded-full border border-yellow-400/50">
                <p className="text-xs font-semibold text-yellow-300">RARE GUARANTEED</p>
              </div>
            )}
          </div>

          {/* Shine overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 animate-shine" />

          {/* Foil flash effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                ref={(el) => { if (el) foilFlashRef.current[i] = el; }}
                className="foil-flash absolute opacity-0"
                style={{
                  left: `${25 * i}%`,
                  top: `${30 + (i % 2) * 30}%`,
                  width: '80px',
                  height: '120px',
                }}
              />
            ))}
          </div>

          {/* Tear fragments overlay */}
          <div ref={tearFragmentsRef} className="absolute inset-0 pointer-events-none opacity-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="tear-fragment absolute"
                style={{
                  left: `${20 + (i % 3) * 30}%`,
                  top: `${30 + Math.floor(i / 3) * 40}%`,
                }}
              />
            ))}
          </div>

          {/* Rare card indicator glow */}
          {hasUltraRare && phase === 'anticipation' && (
            <div className="absolute inset-0 border-4 border-purple-500 rounded-3xl animate-pulse opacity-70" />
          )}
          {hasRareCard && !hasUltraRare && phase === 'anticipation' && (
            <div className="absolute inset-0 border-4 border-yellow-400 rounded-3xl animate-pulse opacity-50" />
          )}
        </div>

        {/* Cards burst effect */}
        <div
          ref={cardsRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 scale-0 pointer-events-none"
        >
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>

        {/* Skip instruction */}
        <div className="absolute bottom-8 text-center z-20">
          <p className="text-sm text-muted-foreground bg-black/50 px-4 py-2 rounded-full">
            {isSkipping ? '⚡ Skipping (5x speed)...' : 'Hold SPACE to skip'}
          </p>
        </div>

        {/* Phase indicator (debug - can remove later) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-20 left-4 text-xs text-muted-foreground bg-black/50 px-2 py-1 rounded">
            Phase: {phase} | Speed: {animationSpeed} | Rare: {hasRareCard ? 'Yes' : 'No'} | Ultra: {hasUltraRare ? 'Yes' : 'No'}
          </div>
        )}
      </div>
    </div>
  );
};
