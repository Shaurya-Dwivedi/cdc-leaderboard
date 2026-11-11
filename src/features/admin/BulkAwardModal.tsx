import { useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { CONFIG } from '../../config';
import { useMembers } from '../../hooks/useMembers';
import { useBulkAwardPoints } from '../../hooks/usePoints';
import { useAuth } from '../../hooks/useAuth';
import type { ReasonCategory } from '../../types';
import { Search, Check, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../../shared/ui/Avatar';

interface BulkAwardModalProps {
  open: boolean;
  onClose: () => void;
}

export function BulkAwardModal({ open, onClose }: BulkAwardModalProps) {
  const { user } = useAuth();
  const { data: members = [] } = useMembers();
  const bulkMutation = useBulkAwardPoints();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [points, setPoints] = useState<string>('20');
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>('Event Helped');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Exclude current admin from awardable members
  const eligibleMembers = members.filter((m) => m.id !== user.id);
  const filtered = eligibleMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedIds(filtered.map((m) => m.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const parsedPoints = parseInt(points, 10);
  const isLargeAdjustment =
    !isNaN(parsedPoints) && Math.abs(parsedPoints) >= CONFIG.LARGE_ADJUSTMENT_THRESHOLD;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIds.length === 0) return;
    if (isNaN(parsedPoints) || parsedPoints === 0) return;

    if (isLargeAdjustment && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    executeBulk();
  };

  const executeBulk = () => {
    bulkMutation.mutate(
      {
        memberIds: selectedIds,
        delta: parsedPoints,
        reasonCategory,
        note: note.trim() || undefined,
        link: link.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setSelectedIds([]);
          setNote('');
          setLink('');
          setShowConfirm(false);
        },
      },
    );
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Bulk Award Points" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Multi-picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Select Members ({selectedIds.length} selected) <span className="text-accent">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] text-accent hover:underline font-semibold"
                >
                  Select Visible
                </button>
                <span className="text-text-muted text-[11px]">•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] text-text-muted hover:text-text-primary"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface-secondary/30 p-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-surface-card text-text-primary border border-border focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-1">
                {filtered.map((m) => {
                  const selected = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded text-xs text-left transition-colors border',
                        selected
                          ? 'bg-accent/15 border-accent/40 text-text-primary font-medium'
                          : 'bg-surface-card border-border/50 text-text-muted hover:bg-surface-secondary',
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar src={m.avatarUrl} name={m.name} size="sm" />
                        <span className="truncate">{m.name}</span>
                      </div>
                      <div
                        className={cn(
                          'h-4 w-4 rounded flex items-center justify-center border flex-shrink-0',
                          selected ? 'bg-accent border-accent text-white' : 'border-border',
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Note: You are automatically excluded from the recipient list as self-awards are restricted.
            </p>
          </div>

          {/* Points */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Points per Member <span className="text-accent">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="1"
                required
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="20"
                className="w-32 px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 font-display font-bold text-sm text-text-primary focus:outline-none focus:border-accent"
              />
              <div className="flex flex-wrap gap-1">
                {[10, 20, 30, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPoints(String(val))}
                    className={cn(
                      'px-2 py-1 text-xs font-display font-semibold rounded border transition-colors',
                      parsedPoints === val
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-surface-secondary border-border text-text-muted hover:text-text-primary',
                    )}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Work Category <span className="text-accent">*</span>
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value as ReasonCategory)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              {CONFIG.REASON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Shared Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Participated in community support sprint"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Reference Link (Optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-border">
            <span className="text-xs text-text-muted">
              Total points to be granted:{' '}
              <strong className="text-text-primary font-display">
                {selectedIds.length * (parsedPoints || 0)} pts
              </strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedIds.length === 0 || isNaN(parsedPoints) || parsedPoints === 0 || bulkMutation.isPending}
                className={cn(
                  'px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5',
                  selectedIds.length === 0 || isNaN(parsedPoints) || parsedPoints === 0 || bulkMutation.isPending
                    ? 'bg-surface-secondary text-text-muted cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-hover shadow-md shadow-accent/20',
                )}
              >
                <Users className="h-3.5 w-3.5" />
                {bulkMutation.isPending ? 'Awarding…' : `Award ${selectedIds.length} Members`}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeBulk}
        title="Confirm Large Bulk Award"
        message={`You are about to award ${parsedPoints} points to each of ${selectedIds.length} members (total ${(selectedIds.length * parsedPoints).toLocaleString('en-IN')} points).`}
        confirmLabel="Yes, Execute Bulk Award"
        variant="warning"
      />
    </>
  );
}
