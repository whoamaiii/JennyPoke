import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Sparkles } from 'lucide-react';
import { isDevModeEnabled, toggleDevMode } from '@/lib/devMode';
import { toast } from 'sonner';

export const DevModeToggle: React.FC = () => {
  const [devMode, setDevMode] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setDevMode(isDevModeEnabled());
  }, []);

  const handleToggle = () => {
    const newState = toggleDevMode();
    setDevMode(newState);

    if (newState) {
      toast.success('Dev Mode Enabled!', {
        description: '🔧 All packs will now contain holographic cards for testing',
        duration: 4000,
      });
    } else {
      toast.info('Dev Mode Disabled', {
        description: '✅ Normal pack distribution restored',
        duration: 3000,
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg bg-background/95 backdrop-blur"
          title="Dev Mode Settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      ) : (
        <div className="bg-background/95 backdrop-blur border-2 border-border rounded-lg shadow-xl p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Dev Mode
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Guarantees holo cards in every pack for testing holographic effects
            </div>

            <Button
              onClick={handleToggle}
              variant={devMode ? 'default' : 'outline'}
              size="sm"
              className="w-full"
            >
              {devMode ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Dev Mode: ON
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Dev Mode: OFF
                </>
              )}
            </Button>

            {devMode && (
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                ✓ All packs will contain holo cards
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
