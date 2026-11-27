import { useEffect, useState, useCallback, type RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown } from 'lucide-react';
import { useBoardMotion } from './board/motion';
import type { LeaderboardEntry } from '../../types';

interface StickyYouBarProps {
  entries: LeaderboardEntry[];
  listRef: RefObject<HTMLDivElement | null>;
}

export function StickyYouBar({ entries, listRef }: StickyYouBarProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const { spring } = useBoardMotion();

  const userEntry = entries.find((e) => e.memberId === user.id);

  const checkVisibility = useCallback(() => {
    if (!listRef.current) return;
    const row = listRef.current.querySelector(`[data-member-id="${user.id}"]`);
    if (!row) {
      setIsVisible(false);
      return;
    }
    const rect = row.getBoundingClientRect();
    const containerRect = listRef.current.getBoundingClientRect();
    const isInView = rect.top >= containerRect.top && rect.bottom <= window.innerHeight;
    setIsVisible(!isInView && !!userEntry);
  }, [user.id, userEntry, listRef]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    window.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility();
    return () => window.removeEventListener('scroll', checkVisibility);
  }, [checkVisibility, listRef]);

  const scrollToRow = () => {
    if (!listRef.current) return;
    const row = listRef.current.querySelector(`[data-member-id="${user.id}"]`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!userEntry) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={spring}
          onClick={scrollToRow}
          className={cn(
            'fixed bottom-4 left-1/2 -translate-x-1/2 z-40',
            'flex min-h-11 items-center gap-4 whitespace-nowrap bg-text-primary px-5',
            'text-surface text-sm font-medium',
          )}
        >
          <span>You are #{userEntry.rank}</span>
          <span className="rb-num">{userEntry.totalPoints} pts</span>
          <ChevronDown className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
