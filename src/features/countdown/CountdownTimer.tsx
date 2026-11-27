import { motion, AnimatePresence } from 'motion/react';
import { useCountdown } from '../../hooks/useCountdown';
import { useBoardMotion } from '../leaderboard/board/motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

function Digit({ value, isUrgent }: { value: number; isUrgent: boolean }) {
  const { spring } = useBoardMotion();
  const display = String(value).padStart(2, '0');
  return (
    <div className="flex gap-0.5">
      {display.split('').map((char, i) => (
        <div
          key={i}
          className="rb-flap relative flex h-11 w-[1.625rem] items-center justify-center overflow-hidden sm:h-12 sm:w-8 md:h-16 md:w-11"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={char}
              className={cn('rb-num text-[1.625rem] sm:text-3xl md:text-5xl', isUrgent ? 'font-bold' : 'font-normal')}
              initial={{ y: '-70%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '70%', opacity: 0 }}
              transition={spring}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export function CountdownTimer() {
  const { days, hours, minutes, seconds, isUrgent, isExpired } = useCountdown();

  if (isExpired) {
    return (
      <div className="flex items-center gap-3 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted motion-reduce:animate-none" />
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
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
            <div className="flex flex-col gap-1.5">
              <Digit value={seg.value} isUrgent={isUrgent} />
              <span className="rb-num text-[10px] tracking-[0.14em] text-text-muted">{seg.label}</span>
            </div>
            {i < segments.length - 1 && (
              <span className="rb-num pt-2 text-2xl text-text-muted md:pt-3 md:text-4xl">:</span>
            )}
          </div>
        ))}
      </div>
      {isUrgent && <span className="rb-eyebrow font-semibold text-text-primary">Closing soon</span>}
    </div>
  );
}
