import { useRef, useEffect } from 'react';

interface HolographicOptions {
  enabled?: boolean;
  intensity?: number; // 0-1 scale
  rotationLimit?: number; // degrees
}

export const useHolographicEffect = (options: HolographicOptions = {}) => {
  const {
    enabled = true,
    intensity = 1,
    rotationLimit = 20
  } = options;

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !cardRef.current) return;

    const card = cardRef.current;
    let animationFrame: number | null = null;
    let isInteracting = false;

    const handlePointerMove = (e: PointerEvent) => {
      isInteracting = true;
      card.classList.add('interacting');

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();

        // Calculate position percentages (0-100)
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;

        // Calculate center-relative position (-0.5 to 0.5)
        const centerX = (px / 100) - 0.5;
        const centerY = (py / 100) - 0.5;

        // Calculate distance from center (0 to 1)
        const distance = Math.sqrt(centerX * centerX + centerY * centerY);
        const normalizedDistance = Math.min(distance / 0.707, 1); // 0.707 is corner distance

        // Calculate rotations
        const rotateY = centerX * rotationLimit * intensity;
        const rotateX = -centerY * (rotationLimit * 0.8) * intensity;

        // Update CSS variables
        card.style.setProperty('--pointer-x', `${px}%`);
        card.style.setProperty('--pointer-y', `${py}%`);
        card.style.setProperty('--pointer-from-center', String(normalizedDistance));
        card.style.setProperty('--card-opacity', String(intensity));
        card.style.setProperty('--rotate-x', `${rotateX}deg`);
        card.style.setProperty('--rotate-y', `${rotateY}deg`);

        // Update background position for shine layer
        // Maps -0.5 to 0.5 range to percentage range for smooth movement
        const bgX = 37 + (centerX + 0.5) * 26; // Maps to 37-63%
        const bgY = 33 + (centerY + 0.5) * 34; // Maps to 33-67%
        card.style.setProperty('--background-x', `${bgX}%`);
        card.style.setProperty('--background-y', `${bgY}%`);

        // Scale up slightly
        card.style.setProperty('--card-scale', String(1.05));
      });
    };

    const handlePointerLeave = () => {
      isInteracting = false;
      card.classList.remove('interacting');

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      // Smoothly reset to neutral position
      card.style.transition = 'transform 0.6s ease-out';
      card.style.setProperty('--card-opacity', '0');
      card.style.setProperty('--rotate-x', '0deg');
      card.style.setProperty('--rotate-y', '0deg');
      card.style.setProperty('--pointer-x', '50%');
      card.style.setProperty('--pointer-y', '50%');
      card.style.setProperty('--background-x', '50%');
      card.style.setProperty('--background-y', '50%');
      card.style.setProperty('--card-scale', '1');

      // Remove transition after animation
      setTimeout(() => {
        if (!isInteracting) {
          card.style.transition = '';
        }
      }, 600);
    };

    // Add event listeners
    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerleave', handlePointerLeave);
    card.addEventListener('pointercancel', handlePointerLeave);

    // Cleanup
    return () => {
      card.removeEventListener('pointermove', handlePointerMove);
      card.removeEventListener('pointerleave', handlePointerLeave);
      card.removeEventListener('pointercancel', handlePointerLeave);

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [enabled, intensity, rotationLimit]);

  return { cardRef };
};
