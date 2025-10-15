import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { universalStorage } from '@/lib/storageManager';

/**
 * Component to check and display storage compatibility status
 */
export const StorageCompatibilityCheck = () => {
  const [storageInfo, setStorageInfo] = useState<{
    type: string;
    available: boolean;
    warning: boolean;
  } | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      const type = universalStorage.getStorageType();
      const available = universalStorage.isAvailable();
      
      // Check if storage is critically low
      const estimate = await universalStorage.estimateSpace();
      let warning = false;
      
      if (estimate) {
        const usagePercent = (estimate.usage / estimate.quota) * 100;
        warning = usagePercent > 80;
      }

      setStorageInfo({
        type: type === 'session' ? 'Session Storage' : 
              type === 'local' ? 'Local Storage' : 
              'In-Memory (temporary)',
        available,
        warning
      });

      // Log storage info for debugging
      console.log('[StorageCheck]', {
        type,
        available,
        warning,
        estimate
      });
    };

    checkStorage();
  }, []);

  // Only show alert if there's an issue
  if (!storageInfo || (storageInfo.available && !storageInfo.warning)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Alert variant={storageInfo.warning ? "default" : "destructive"}>
        {storageInfo.available ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {storageInfo.warning ? 'Storage Warning' : 'Limited Storage'}
        </AlertTitle>
        <AlertDescription>
          {storageInfo.warning ? (
            <>
              Your device storage is running low. Using {storageInfo.type}. 
              Some features may be limited.
            </>
          ) : (
            <>
              Using {storageInfo.type}. Card images will not persist between sessions.
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
