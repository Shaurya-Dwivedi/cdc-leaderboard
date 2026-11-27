import { MotionConfig } from 'motion/react';
import { PodiumColumn } from './PodiumColumn';
import { PodiumSkeleton } from '../../shared/ui/Skeleton';
import type { LeaderboardEntry } from '../../types';
import { splitPodium } from '../../lib/ranking';

interface PodiumProps {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

type Place = 1 | 2 | 3;
const DELAY: Record<Place, number> = { 1: 0, 2: 0.15, 3: 0.25 };

export function Podium({ entries, isLoading }: PodiumProps) {
  if (isLoading) return <PodiumSkeleton />;

  // One column per member: tied members share a place. Places beyond the member count
  // (e.g. 3rd when two share 1st) stay empty placeholders.
  const slots: { entry: LeaderboardEntry | null; place: Place }[] = splitPodium(entries).podium.map(
    (entry) => ({ entry, place: entry.rank as Place }),
  );
  const filled = slots.length;
  for (const place of [1, 2, 3] as const) {
    if (place > filled) slots.push({ entry: null, place });
  }

  // Classic 2-1-3 layout when every place is distinct, otherwise plain rank order.
  const distinct = slots.length === 3 && slots.every((s, i) => s.place === i + 1);
  const ordered = distinct ? [slots[1], slots[0], slots[2]] : slots;

  // Re-animate whenever who holds the podium changes
  const animKey = ordered.map((s) => s.entry?.memberId ?? `empty-${s.place}`).join('-');

  return (
    <MotionConfig reducedMotion="user">
      <div
        key={animKey}
        className="flex flex-wrap items-end justify-center gap-2 md:gap-4 py-6"
        role="region"
        aria-label="Top 3 podium"
      >
        {ordered.map((s) => (
          <PodiumColumn
            key={s.entry?.memberId ?? `empty-${s.place}`}
            entry={s.entry}
            place={s.place}
            delay={DELAY[s.place]}
          />
        ))}
      </div>
    </MotionConfig>
  );
}
