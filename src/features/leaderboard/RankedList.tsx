import { useState, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { RankedRow } from './RankedRow';
import { SearchFilter } from './SearchFilter';
import { StickyYouBar } from './StickyYouBar';
import { RowSkeleton } from '../../shared/ui/Skeleton';
import { EmptyState } from '../../shared/ui/EmptyState';
import { splitPodium } from '../../lib/ranking';
import { staggerDelay } from './board/motion';
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
        icon={null}
        title="No standings yet"
        description="Points haven't been awarded this period. Check back soon!"
      />
    );
  }

  return (
    <div className="mt-4">
      <SearchFilter value={search} onChange={setSearch} className="max-w-sm" />

      <div ref={listRef} className="mt-2">
        <AnimatePresence mode="popLayout">
          {paginated.map((entry, i) => (
            <RankedRow
              key={entry.memberId}
              entry={entry}
              showWeeklyPoints={scope === 'alltime'}
              onAwardPoints={onAwardPoints}
              enterDelay={staggerDelay(i + 3)}
            />
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="rb-btn mx-auto mt-4 flex text-text-muted"
        >
          Show more <span className="rb-num">({filtered.length - paginated.length} remaining)</span>
        </button>
      )}

      {filtered.length === 0 && search && (
        <EmptyState
          icon={null}
          title="No matches"
          description={`No members found matching "${search}"`}
        />
      )}

      {entries && <StickyYouBar entries={entries} listRef={listRef} />}
    </div>
  );
}
