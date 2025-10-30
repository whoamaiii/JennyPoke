import { AnimationSpeed } from './EnhancedPackOpening';
import { useAnimationSpeed } from '@/hooks/useAnimationSpeed';
import { Zap, Play, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export const AnimationSpeedControl = () => {
  const [speed, setSpeed] = useAnimationSpeed();

  const speedOptions: Array<{
    value: AnimationSpeed;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'fast',
      label: 'Fast',
      description: '~1.5 seconds (1.5x speed)',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      value: 'normal',
      label: 'Normal',
      description: '~2.2 seconds (recommended)',
      icon: <Play className="w-4 h-4" />,
    },
    {
      value: 'cinematic',
      label: 'Cinematic',
      description: '~4+ seconds (0.75x speed)',
      icon: <Film className="w-4 h-4" />,
    },
  ];

  const currentOption = speedOptions.find((opt) => opt.value === speed) || speedOptions[1];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Animation speed settings">
          {currentOption.icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Animation Speed</h4>
            <p className="text-xs text-muted-foreground">
              Choose how fast pack opening animations play
            </p>
          </div>

          <RadioGroup
            value={speed}
            onValueChange={(value) => setSpeed(value as AnimationSpeed)}
          >
            {speedOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSpeed(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={option.value}
                    className="font-medium flex items-center gap-2 cursor-pointer"
                  >
                    {option.icon}
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            <p>Current: <span className="font-medium">{currentOption.label}</span></p>
            <p className="mt-1">Settings are saved automatically</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Export the hook for use in other components
export { useAnimationSpeed };
