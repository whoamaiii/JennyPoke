import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Gift, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarDoorProps {
  day: number;
  isAvailable: boolean;
  isOpened: boolean;
  isToday: boolean;
  onClick: () => void;
}

export const CalendarDoor: React.FC<CalendarDoorProps> = ({
  day,
  isAvailable,
  isOpened,
  isToday,
  onClick
}) => {
  const canClick = isAvailable && !isOpened;

  return (
    <motion.div
      whileHover={canClick ? { scale: 1.05, y: -5 } : {}}
      whileTap={canClick ? { scale: 0.95 } : {}}
      className={cn(
        "relative w-full aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all duration-300",
        "border-4 shadow-lg",
        {
          // Opened state
          "bg-gradient-to-br from-green-500 to-green-700 border-green-400": isOpened,
          // Today's door (special highlight)
          "bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-400 animate-pulse": !isOpened && isToday && isAvailable,
          // Available but not opened
          "bg-gradient-to-br from-red-600 to-red-800 border-red-500 hover:border-yellow-400": !isOpened && !isToday && isAvailable,
          // Locked (future date)
          "bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500 opacity-60 cursor-not-allowed": !isAvailable,
        }
      )}
      onClick={canClick ? onClick : undefined}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')] opacity-30" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 text-white">
        {/* Day Number */}
        <div className={cn(
          "text-5xl md:text-6xl font-bold mb-2 drop-shadow-lg",
          {
            "text-white": !isOpened,
            "text-green-100": isOpened
          }
        )}>
          {day}
        </div>

        {/* Status Icon */}
        <div className="mt-2">
          {isOpened ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Check className="w-8 h-8 text-white drop-shadow-lg" />
            </motion.div>
          ) : isAvailable ? (
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: isToday ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Gift className="w-8 h-8 text-white drop-shadow-lg" />
            </motion.div>
          ) : (
            <Lock className="w-8 h-8 text-gray-300 drop-shadow-lg" />
          )}
        </div>

        {/* Today badge */}
        {isToday && !isOpened && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 right-2 bg-white text-yellow-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg"
          >
            TODAY
          </motion.div>
        )}

        {/* Opened badge */}
        {isOpened && (
          <div className="absolute top-2 left-2 bg-white text-green-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            OPENED
          </div>
        )}
      </div>

      {/* Shine effect for available doors */}
      {canClick && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
          animate={{
            opacity: [0, 0.3, 0],
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
      )}
    </motion.div>
  );
};
