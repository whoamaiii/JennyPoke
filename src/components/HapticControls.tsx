import React from 'react';
import { Button } from '@/components/ui/button';
import { Vibrate, VibrateOff } from 'lucide-react';
import { hapticManager } from '@/lib/haptics';

export const HapticControls = () => {
  const [enabled, setEnabled] = React.useState(hapticManager.isEnabled());

  const toggleHaptics = () => {
    const newState = hapticManager.toggle();
    setEnabled(newState);

    // Give feedback
    if (newState) {
      hapticManager.vibrate('success');
    }
  };

  if (!hapticManager.isSupported()) {
    return null; // Hide if not supported
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleHaptics}
      aria-label={enabled ? 'Disable haptics' : 'Enable haptics'}
    >
      {enabled ? <Vibrate className="h-4 w-4" /> : <VibrateOff className="h-4 w-4" />}
    </Button>
  );
};
