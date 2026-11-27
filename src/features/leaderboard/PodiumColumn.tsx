import type { Ref } from 'react';
import { motion } from 'motion/react';
import { RankedRow } from './RankedRow';
import { useBoardMotion } from './board/motion';
import type { LeaderboardEntry } from '../../types';

interface PodiumColumnProps {
  entry: LeaderboardEntry | null;
  place: 1 | 2 | 3;
  delay: number;
  ref?: Ref<HTMLDivElement>;
}

/** One top-3 line of the ledger: set large, no podium furniture. */
export function PodiumColumn({ entry, place, delay, ref }: PodiumColumnProps) {
  const { fade } = useBoardMotion();

  if (entry) return <RankedRow ref={ref} entry={entry} place={place} enterDelay={delay} />;

  // Nobody has earned this place yet
  return (
    <motion.div
      ref={ref}
      layout="position"
      className="rb-row rb-grid rb-top"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ ...fade, delay }}
    >
      <span className="rb-rank rb-num text-[2.25rem] text-text-muted sm:text-[2.75rem]">{place}</span>
      <span className="rb-name rb-serif text-xl text-text-muted">Unclaimed</span>
    </motion.div>
  );
}
