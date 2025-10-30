import React, { useState } from 'react';
import { useHolographicEffect } from '@/hooks/useHolographicEffect';
import { Button } from '@/components/ui/button';
import { Home, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '@/styles/holographic.css';

const HolographicDemo = () => {
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState(1);
  const [rotationLimit, setRotationLimit] = useState(20);

  // Example Charizard card
  const { cardRef: charizardRef } = useHolographicEffect({
    enabled: true,
    intensity,
    rotationLimit
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            Holographic Card Demo
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </h1>
          <p className="text-xl text-white/80">
            Move your mouse over the card to see the holographic effect!
          </p>
        </div>

        {/* Main Demo */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Card Display */}
          <div className="flex justify-center">
            <div
              ref={charizardRef}
              className="holo-card fire"
              data-rarity="rare holo"
              style={{ width: '367px', maxWidth: '100%' }}
            >
              <div className="holo-card__translater">
                <div className="holo-card__rotator">
                  <div className="holo-card__front">
                    {/* Charizard card image */}
                    <img
                      src="https://images.pokemontcg.io/base1/4_hires.png"
                      alt="Charizard Holographic Card"
                      draggable="false"
                    />

                    {/* Holographic layers */}
                    <div className="holo-card__shine" />
                    <div className="holo-card__glare" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls and Info */}
          <div className="space-y-8">
            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">How to Use</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">1.</span>
                  <span>Move your mouse over the card slowly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">2.</span>
                  <span>Watch the rainbow shine shift with your movement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">3.</span>
                  <span>Notice the 3D tilt effect as the card rotates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">4.</span>
                  <span>See the glare following your cursor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">5.</span>
                  <span>Move your mouse away to see it smoothly return</span>
                </li>
              </ul>
            </div>

            {/* Controls */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">Effect Controls</h3>

              {/* Intensity Slider */}
              <div className="mb-6">
                <label className="block text-white mb-2 font-semibold">
                  Intensity: {intensity.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={intensity}
                  onChange={(e) => setIntensity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>Subtle (0)</span>
                  <span>Normal (1)</span>
                  <span>Intense (2)</span>
                </div>
              </div>

              {/* Rotation Limit Slider */}
              <div>
                <label className="block text-white mb-2 font-semibold">
                  Rotation: {rotationLimit}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={rotationLimit}
                  onChange={(e) => setRotationLimit(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>None (0°)</span>
                  <span>Moderate (15°)</span>
                  <span>Extreme (30°)</span>
                </div>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => {
                  setIntensity(1);
                  setRotationLimit(20);
                }}
                variant="outline"
                className="w-full mt-4 bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                Reset to Defaults
              </Button>
            </div>

            {/* What's Special */}
            <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-lg p-6 border-2 border-yellow-400/50">
              <h3 className="text-2xl font-bold text-yellow-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                What Makes This Special?
              </h3>
              <ul className="space-y-2 text-white/90">
                <li>✨ <strong>Rainbow Holographic</strong> - Authentic Pokemon card effect</li>
                <li>💎 <strong>3D Tilt</strong> - Card rotates in 3D space</li>
                <li>🌟 <strong>Dynamic Glare</strong> - Light reflection follows cursor</li>
                <li>🎯 <strong>Smooth Physics</strong> - Natural spring-like movement</li>
                <li>🚀 <strong>Hardware Accelerated</strong> - Smooth 60fps performance</li>
              </ul>
            </div>

            {/* Apply to Project */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-green-500/50">
              <h3 className="text-2xl font-bold text-green-400 mb-3">
                Ready to Apply?
              </h3>
              <p className="text-white/90 mb-4">
                This effect is ready to integrate into your Pokemon advent calendar!
                Perfect for making custom cards feel truly special.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/advent')}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  View Advent Calendar
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                  onClick={() => window.open('/HOLOGRAPHIC_INTEGRATION_GUIDE.md', '_blank')}
                >
                  Read Integration Guide
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Examples (if you want to show more) */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Different Card Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Regular Holo */}
            <div className="text-center">
              <div className="mb-4 text-white/80 font-semibold">Regular Holo</div>
              <div className="text-sm text-white/60 mb-2">Rainbow gradient effect</div>
            </div>

            {/* Cosmos Holo */}
            <div className="text-center">
              <div className="mb-4 text-white/80 font-semibold">Cosmos Holo</div>
              <div className="text-sm text-white/60 mb-2">Galaxy/space effect (coming soon)</div>
            </div>

            {/* Rainbow Rare */}
            <div className="text-center">
              <div className="mb-4 text-white/80 font-semibold">Rainbow Rare</div>
              <div className="text-sm text-white/60 mb-2">Secret rare effect (coming soon)</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Slider styling */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default HolographicDemo;
