import { useState, useMemo, useRef } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { RankedRow } from './RankedRow';
import { SearchFilter } from './SearchFilter';
import { StickyYouBar } from './StickyYouBar';
import { RowSkeleton } from '../../shared/ui/Skeleton';
import { EmptyState } from '../../shared/ui/EmptyState';
import { Users } from 'lucide-react';
import { splitPodium } from '../../lib/ranking';
import type { LeaderboardEntry, LeaderboardScope } from '../../types';

interface RankedListProps {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
  scope: LeaderboardScope;
  onAwardPoints?: (memberId: string) => void;
}

const PAGE_SIZE = 50;

export function RankedList({ entries, isLoading, scope, onAwardPoints }: RankedListProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Everyone the podium does not show (includes members tied into places 1-3)
  const listEntries = useMemo(() => splitPodium(entries).rest, [entries]);

  const filtered = useMemo(() => {
    if (!search) return listEntries;
    const q = search.toLowerCase();
    return listEntries.filter((e) => e.memberName.toLowerCase().includes(q));
  }, [listEntries, search]);

  const paginated = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const hasMore = paginated.length < filtered.length;

  if (isLoading) {
    return (
      <div className="space-y-1 mt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No standings yet"
        description="Points haven't been awarded this period. Check back soon!"
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mt-6 space-y-3">
        <SearchFilter value={search} onChange={setSearch} className="max-w-sm" />

        <div ref={listRef} className="space-y-0.5">
          <AnimatePresence mode="popLayout">
            {paginated.map((entry) => (
              <div key={entry.memberId} data-member-id={entry.memberId}>
                <RankedRow
                  entry={entry}
                  showWeeklyPoints={scope === 'alltime'}
                  onAwardPoints={onAwardPoints}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {hasMore && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="mx-auto block rounded-lg px-6 py-2 text-sm font-medium text-text-muted hover:bg-surface-secondary transition-colors"
          >
            Show more ({filtered.length - paginated.length} remaining)
          </button>
        )}

        {filtered.length === 0 && search && (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No matches"
            description={`No members found matching "${search}"`}
          />
        )}

        {entries && <StickyYouBar entries={entries} listRef={listRef} />}
      </div>
    </MotionConfig>
  );
}
