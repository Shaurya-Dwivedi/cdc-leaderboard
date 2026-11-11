import { useState, useMemo } from 'react';
import { Drawer } from '../../shared/ui/Drawer';
import { useAuditLog, useRevertEntry } from '../../hooks/usePoints';
import { useMembers } from '../../hooks/useMembers';
import { Avatar } from '../../shared/ui/Avatar';
import { RotateCcw, Filter, Search, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface AuditLogProps {
  open: boolean;
  onClose: () => void;
}

export function AuditLog({ open, onClose }: AuditLogProps) {
  const { data: members = [] } = useMembers();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const { data: logEntries = [], isLoading } = useAuditLog();
  const revertMutation = useRevertEntry();

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Identify all entries that have been reverted by finding entries with `revertsId`
  const revertedTargetIds = useMemo(() => {
    const set = new Set<string>();
    for (const e of logEntries) {
      if (e.revertsId) set.add(e.revertsId);
    }
    return set;
  }, [logEntries]);

  const filteredEntries = useMemo(() => {
    return logEntries.filter((entry) => {
      if (selectedMemberId && entry.memberId !== selectedMemberId) return false;
      if (search) {
        const q = search.toLowerCase();
        const member = memberMap.get(entry.memberId);
        const admin = memberMap.get(entry.createdBy);
        const matchesMember = member?.name.toLowerCase().includes(q);
        const matchesAdmin = admin?.name.toLowerCase().includes(q);
        const matchesReason = entry.reasonCategory.toLowerCase().includes(q);
        const matchesNote = entry.note?.toLowerCase().includes(q);
        if (!matchesMember && !matchesAdmin && !matchesReason && !matchesNote) return false;
      }
      return true;
    });
  }, [logEntries, selectedMemberId, search, memberMap]);

  const handleRevert = (entryId: string) => {
    setRevertingId(entryId);
    revertMutation.mutate(entryId, {
      onSettled: () => setRevertingId(null),
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Points Audit Log & Ledger" className="md:w-[620px]">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by member, admin, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-text-muted" />
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Entries List */}
        {isLoading ? (
          <div className="space-y-2 py-8 text-center text-xs text-text-muted">
            Loading audit log…
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            No audit log entries matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-border/60 border border-border rounded-xl bg-surface-card overflow-hidden">
            {filteredEntries.map((entry) => {
              const member = memberMap.get(entry.memberId);
              const admin = memberMap.get(entry.createdBy);
              const isReverted = revertedTargetIds.has(entry.id);
              const isReverting = revertingId === entry.id;
              const isCompensating = !!entry.revertsId;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'p-3 flex items-start justify-between gap-3 text-xs transition-colors hover:bg-surface-secondary/40',
                    isReverted && 'opacity-60 bg-surface-secondary/20',
                    isCompensating && 'bg-amber-500/5',
                  )}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-medium text-text-primary">
                        <Avatar
                          src={member?.avatarUrl}
                          name={member?.name || 'Member'}
                          size="sm"
                        />
                        <span className={cn(isReverted && 'line-through')}>
                          {member?.name || entry.memberId}
                        </span>
                      </div>

                      <span
                        className={cn(
                          'font-display font-bold px-1.5 py-0.5 rounded text-[11px]',
                          entry.delta > 0 ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative',
                          isReverted && 'line-through',
                        )}
                      >
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta} pts
                      </span>

                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted">
                        {entry.reasonCategory}
                      </span>

                      {isReverted && (
                        <span className="text-[10px] bg-negative/20 text-negative font-bold px-1.5 py-0.5 rounded">
                          REVERTED
                        </span>
                      )}
                      {isCompensating && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-500 font-bold px-1.5 py-0.5 rounded">
                          REVERT ENTRY
                        </span>
                      )}
                    </div>

                    {entry.note && (
                      <p className="text-text-muted text-[11px] leading-relaxed break-words">
                        {entry.note}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-text-muted/80 pt-0.5">
                      <span>By: {admin?.name || 'Admin'}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(entry.createdAt), 'MMM d, yyyy • HH:mm:ss')}
                      </span>
                      {entry.link && (
                        <>
                          <span>•</span>
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-accent hover:underline"
                          >
                            <span>Link</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Revert Button (only if not already reverted and not a compensating revert entry itself) */}
                  {!isReverted && !isCompensating && (
                    <button
                      onClick={() => handleRevert(entry.id)}
                      disabled={isReverting || revertMutation.isPending}
                      title="Revert this point entry (creates compensating ledger entry)"
                      className="p-1.5 rounded-lg border border-border text-text-muted hover:text-negative hover:border-negative/50 hover:bg-negative/10 transition-colors flex-shrink-0"
                    >
                      <RotateCcw className={cn('h-3.5 w-3.5', isReverting && 'animate-spin')} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
