import { AnimatePresence } from 'motion/react';
import { PodiumColumn } from './PodiumColumn';
import { RowSkeleton } from '../../shared/ui/Skeleton';
import { staggerDelay } from './board/motion';
import type { LeaderboardEntry } from '../../types';
import { splitPodium } from '../../lib/ranking';

interface PodiumProps {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

type Place = 1 | 2 | 3;

export function Podium({ entries, isLoading }: PodiumProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[0, 1, 2].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  // One line per member: tied members share a place. Places beyond the member count
  // (e.g. 3rd when two share 1st) stay empty placeholders.
  const slots: { entry: LeaderboardEntry | null; place: Place }[] = splitPodium(entries).podium.map(
    (entry) => ({ entry, place: entry.rank as Place }),
  );
  const filled = slots.length;
  for (const place of [1, 2, 3] as const) {
    if (place > filled) slots.push({ entry: null, place });
  }

  return (
    <div role="region" aria-label="Top 3 podium">
      <AnimatePresence mode="popLayout">
        {slots.map((s, i) => (
          <PodiumColumn
            key={s.entry?.memberId ?? `empty-${s.place}`}
            entry={s.entry}
            place={s.place}
            delay={staggerDelay(i)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
