import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '@/lib/audioManager';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const AudioControls = () => {
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [volume, setVolume] = useState(audioManager.getVolume() * 100);

  // Sync with audioManager on mount
  useEffect(() => {
    setIsMuted(audioManager.isMuted());
    setVolume(audioManager.getVolume() * 100);
  }, []);

  const handleMuteToggle = () => {
    const newMutedState = audioManager.toggleMute();
    setIsMuted(newMutedState);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    audioManager.setVolume(newVolume / 100);

    // Unmute if user is adjusting volume
    if (isMuted && newVolume > 0) {
      audioManager.unmute();
      setIsMuted(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Audio Settings</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="h-8 px-2"
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-4 w-4 mr-1" />
                  <span className="text-xs">Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-1" />
                  <span className="text-xs">Mute</span>
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Volume</label>
              <span className="text-xs font-medium">{Math.round(volume)}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              min={0}
              step={1}
              className="w-full"
              disabled={isMuted}
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Sound effects enhance pack opening animations
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
