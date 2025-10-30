import confetti from 'canvas-confetti';

export interface ParticleTrailConfig {
  color?: string[];
  particleCount?: number;
  velocity?: number;
  spread?: number;
  gravity?: number;
  decay?: number;
}

export class ParticleTrailSystem {
  private intervalId: number | null = null;
  private animationFrame: number | null = null;
  private lastPosition: { x: number; y: number } = { x: 0, y: 0 };

  start(
    element: HTMLElement,
    config: ParticleTrailConfig = {},
    duration: number
  ): void {
    const {
      color = ['#FFD700', '#FFA500'],
      particleCount = 3,
      velocity = 15,
      spread = 40,
      gravity = 0.8,
      decay = 0.95,
    } = config;

    let startTime = Date.now();

    const emitParticles = () => {
      const rect = element.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      // Calculate velocity based on movement
      const dx = x - this.lastPosition.x;
      const dy = y - this.lastPosition.y;
      const speed = Math.sqrt(dx * dx + dy * dy) * 100;

      this.lastPosition = { x, y };

      // Only emit if there's movement
      if (speed > 0.5) {
        confetti({
          particleCount: Math.min(particleCount + Math.floor(speed / 5), 8),
          startVelocity: velocity + speed * 2,
          spread,
          origin: { x, y },
          colors: color,
          gravity,
          decay,
          ticks: 60,
          shapes: ['circle'],
          scalar: 0.7,
        });
      }

      // Check if duration has elapsed
      if (Date.now() - startTime < duration) {
        this.animationFrame = requestAnimationFrame(emitParticles);
      }
    };

    this.animationFrame = requestAnimationFrame(emitParticles);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}
