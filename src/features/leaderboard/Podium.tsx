import { MotionConfig } from 'motion/react';
import { PodiumColumn } from './PodiumColumn';
import { PodiumSkeleton } from '../../shared/ui/Skeleton';
import type { LeaderboardEntry } from '../../types';
import { useMemo } from 'react';
import { splitPodium } from '../../lib/ranking';

interface PodiumProps {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

export function Podium({ entries, isLoading }: PodiumProps) {
  if (isLoading) return <PodiumSkeleton />;

  const podiumEntries = useMemo(() => splitPodium(entries).podium, [entries]);

  // Use member IDs as key so podium re-animates on data change
  const animKey = podiumEntries.map((e) => e?.memberId ?? 'empty').join('-');

  return (
    <MotionConfig reducedMotion="user">
      <div
        key={animKey}
        className="flex items-end justify-center gap-2 md:gap-4 py-6"
        role="region"
        aria-label="Top 3 podium"
      >
        <PodiumColumn entry={podiumEntries[1]} place={2} delay={0.15} />
        <PodiumColumn entry={podiumEntries[0]} place={1} delay={0} />
        <PodiumColumn entry={podiumEntries[2]} place={3} delay={0.25} />
      </div>
    </MotionConfig>
  );
}
