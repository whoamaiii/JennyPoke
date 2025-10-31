import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Loader2 } from 'lucide-react';
import pokeballSvg from '@/assets/pokeball.svg';

interface PackOpeningProps {
  onComplete: () => void;
  variant?: 'standard' | 'rare' | 'ultra';
}

export const PackOpening = ({ onComplete, variant = 'standard' }: PackOpeningProps) => {
  const packRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const lastVariantRef = useRef<'standard' | 'rare' | 'ultra'>(variant);
  const confettiRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    // Detect prefers-reduced-motion
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = media.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const spawnConfettiBurst = () => {
    if (reducedMotionRef.current) return;
    const container = confettiRef.current;
    if (!container) return;
    const colors = ['#FFD700', '#6366F1', '#F472B6', '#22D3EE', '#34D399', '#FBBF24'];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      const size = 6 + Math.random() * 6;
      const startX = Math.random() * window.innerWidth;
      const startY = -20 - Math.random() * 40;
      piece.style.position = 'absolute';
      piece.style.left = `${startX}px`;
      piece.style.top = `${startY}px`;
      piece.style.width = `${size}px`;
      piece.style.height = `${size * (0.6 + Math.random() * 0.6)}px`;
      piece.style.background = colors[i % colors.length];
      piece.style.borderRadius = Math.random() < 0.4 ? '50%' : '4px';
      piece.style.opacity = '0.95';
      container.appendChild(piece);

      const driftX = (Math.random() - 0.5) * (window.innerWidth * 0.6);
      const fallY = window.innerHeight + 100 + Math.random() * 120;
      const rot = (Math.random() - 0.5) * 360;
      const duration = 1.4 + Math.random() * 0.9;

      gsap.fromTo(
        piece,
        { y: startY, x: startX, rotate: 0 },
        {
          x: startX + driftX,
          y: fallY,
          rotate: rot,
          ease: 'power2.out',
          duration,
          onComplete: () => {
            piece.remove();
          },
        }
      );
    }
  };

  useEffect(() => {
    // Respect reduced motion: skip heavy animation and complete quickly
    if (reducedMotionRef.current) {
      if (cardsRef.current) gsap.set(cardsRef.current, { scale: 1, opacity: 1 });
      if (packRef.current) gsap.set(packRef.current, { scale: 0, opacity: 0 });
      const t = setTimeout(onComplete, 300);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 500);
      },
    });
    tlRef.current = tl;

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
      // trigger shine sweep and variant glow
      .add(() => {
        if (shineRef.current) {
          shineRef.current.classList.remove('animate');
          requestAnimationFrame(() => {
            if (!shineRef.current) return;
            shineRef.current.classList.add('animate');
            setTimeout(() => {
              shineRef.current && shineRef.current.classList.remove('animate');
            }, 900);
          });
        }
      })
      .to(packRef.current, {
        boxShadow:
          variant === 'ultra'
            ? '0 0 140px rgba(255,215,0,0.85), 0 0 240px rgba(99,102,241,0.6)'
            : variant === 'rare'
            ? '0 0 120px rgba(255,215,0,0.75)'
            : '0 0 90px rgba(255,255,255,0.45)',
        duration: 0.25,
      })
      .to(packRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
      })
      .add(() => {
        if (variant === 'ultra') spawnConfettiBurst();
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
    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      if (shineRef.current) {
        shineRef.current.classList.remove('animate');
      }
      if (confettiRef.current) {
        confettiRef.current.innerHTML = '';
      }
    };
  }, [onComplete, variant]);

  // Upgrade animation if variant changes while component is visible
  useEffect(() => {
    const prev = lastVariantRef.current;
    if ((prev === 'standard' && (variant === 'rare' || variant === 'ultra')) || (prev === 'rare' && variant === 'ultra')) {
      if (packRef.current) {
        gsap.fromTo(
          packRef.current,
          { boxShadow: '0 0 0px rgba(255,215,0,0)' },
          {
            boxShadow:
              variant === 'ultra'
                ? '0 0 160px rgba(255,215,0,0.95), 0 0 260px rgba(99,102,241,0.7)'
                : '0 0 120px rgba(255,215,0,0.8)',
            duration: 0.25,
            yoyo: true,
            repeat: 1,
          }
        );
      }
      if (shineRef.current) {
        shineRef.current.classList.remove('animate');
        requestAnimationFrame(() => {
          shineRef.current && shineRef.current.classList.add('animate');
          setTimeout(() => shineRef.current && shineRef.current.classList.remove('animate'), 900);
        });
      }
      if (variant === 'ultra') {
        spawnConfettiBurst();
      }
    }
    lastVariantRef.current = variant;
  }, [variant]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden">
      <div className="relative flex items-center justify-center w-full h-full max-h-screen">
        {/* Skip animation (optional) */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 px-3 py-1 rounded-md text-sm bg-card/80 border border-border hover:bg-card transition-colors"
          aria-label="Skip pack opening animation"
        >
          Skip
        </button>
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
            <div ref={shineRef} className="shine w-24 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transform -translate-x-1/2" />
          </div>
        </div>

        {/* Cards burst effect */}
        <div
          ref={cardsRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 scale-0 pointer-events-none"
        >
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      {/* Confetti overlay */}
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
      </div>
    </div>
  );
};
