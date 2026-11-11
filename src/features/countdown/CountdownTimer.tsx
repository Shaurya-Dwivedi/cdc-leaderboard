import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useCountdown } from '../../hooks/useCountdown';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

function Digit({ value, isUrgent }: { value: number; isUrgent: boolean }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className="flex gap-0.5">
      {display.split('').map((char, i) => (
        <div
          key={i}
          className={cn(
            'relative flex h-14 w-9 items-center justify-center rounded-lg bg-surface-secondary overflow-hidden',
            'md:h-20 md:w-14',
          )}
        >
          <AnimatePresence mode="popLayout">
            <motion.span
              key={char}
              className={cn(
                'font-display text-2xl font-bold tabular-nums md:text-4xl',
                isUrgent ? 'text-accent' : 'text-text-primary',
              )}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function Separator({ isUrgent }: { isUrgent: boolean }) {
  return (
    <span
      className={cn(
        'font-display text-2xl font-bold md:text-4xl self-center pb-5',
        isUrgent ? 'text-accent' : 'text-text-muted',
      )}
    >
      :
    </span>
  );
}

export function CountdownTimer() {
  const { days, hours, minutes, seconds, isUrgent, isExpired } = useCountdown();

  if (isExpired) {
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
        <span className="text-sm font-medium text-text-muted">
          Week closed — calculating winners…
        </span>
      </div>
    );
  }

  const segments = [
    { value: days, label: 'DAYS' },
    { value: hours, label: 'HRS' },
    { value: minutes, label: 'MIN' },
    { value: seconds, label: 'SEC' },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          'flex items-center justify-center gap-2 md:gap-4 py-4 px-4 rounded-xl transition-colors duration-500',
          isUrgent && 'animate-pulse-subtle',
        )}
      >
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center gap-1">
              <Digit value={seg.value} isUrgent={isUrgent} />
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-widest md:text-xs',
                  isUrgent ? 'text-accent/70' : 'text-text-muted',
                )}
              >
                {seg.label}
              </span>
            </div>
            {i < segments.length - 1 && <Separator isUrgent={isUrgent} />}
          </div>
        ))}
      </div>
    </MotionConfig>
  );
}
