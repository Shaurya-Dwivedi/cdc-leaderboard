import { useState, useEffect } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { CONFIG } from '../../config';
import { useMembers } from '../../hooks/useMembers';
import { useAwardPoints } from '../../hooks/usePoints';
import { useAuth } from '../../hooks/useAuth';
import type { ReasonCategory } from '../../types';
import { Search, Check, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../../shared/ui/Avatar';

interface AwardPointsModalProps {
  open: boolean;
  onClose: () => void;
  preselectedMemberId?: string | null;
}

export function AwardPointsModal({ open, onClose, preselectedMemberId }: AwardPointsModalProps) {
  const { user } = useAuth();
  const { data: members = [] } = useMembers();
  const awardMutation = useAwardPoints();

  const [memberId, setMemberId] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [points, setPoints] = useState<string>('25');
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>('Ticket Resolved');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (preselectedMemberId) {
      setMemberId(preselectedMemberId);
    } else if (!memberId && members.length > 0) {
      // Find first non-admin member if available
      const nonAdmin = members.find((m) => m.id !== user.id);
      if (nonAdmin) setMemberId(nonAdmin.id);
    }
  }, [preselectedMemberId, members, user.id]);

  const selectedMember = members.find((m) => m.id === memberId);
  const isSelf = memberId === user.id;

  const parsedPoints = parseInt(points, 10);
  const isLargeAdjustment =
    !isNaN(parsedPoints) && Math.abs(parsedPoints) >= CONFIG.LARGE_ADJUSTMENT_THRESHOLD;

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!memberId) return;
    if (isSelf) return;
    if (isNaN(parsedPoints) || parsedPoints === 0) return;

    if (isLargeAdjustment && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    executeAward();
  };

  const executeAward = () => {
    awardMutation.mutate(
      {
        memberId,
        delta: parsedPoints,
        reasonCategory,
        note: note.trim() || undefined,
        link: link.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setNote('');
          setLink('');
          setPoints('25');
          setShowConfirm(false);
        },
      },
    );
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Award / Adjust Points" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Team Member <span className="text-accent">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg border bg-surface-secondary/50 text-sm text-text-primary text-left transition-colors',
                  isDropdownOpen ? 'border-accent ring-1 ring-accent/30' : 'border-border',
                )}
              >
                {selectedMember ? (
                  <div className="flex items-center gap-2">
                    <Avatar src={selectedMember.avatarUrl} name={selectedMember.name} size="sm" />
                    <span className="font-medium">{selectedMember.name}</span>
                    {selectedMember.id === user.id && (
                      <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-text-muted">Select a member...</span>
                )}
                <span className="text-xs text-text-muted">▼</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface-card shadow-xl max-h-56 overflow-y-auto p-1">
                  <div className="sticky top-0 bg-surface-card p-1 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search member..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-surface-secondary text-text-primary border border-border focus:outline-none focus:border-accent"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {filteredMembers.map((m) => {
                      const isSelfMember = m.id === user.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMemberId(m.id);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-surface-secondary transition-colors text-left',
                            m.id === memberId && 'bg-surface-secondary font-semibold text-accent',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar src={m.avatarUrl} name={m.name} size="sm" />
                            <span>{m.name}</span>
                            {isSelfMember && (
                              <span className="text-[10px] text-text-muted">(You - restricted)</span>
                            )}
                          </div>
                          {m.id === memberId && <Check className="h-3.5 w-3.5 text-accent" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {isSelf && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-negative">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admins cannot award points to themselves.</span>
              </div>
            )}
          </div>

          {/* Points Input + Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Points (Positive or Negative) <span className="text-accent">*</span>
              </label>
              {isLargeAdjustment && (
                <span className="text-[11px] text-amber-500 font-medium">
                  Large adjustment (requires confirmation)
                </span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="1"
                required
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="e.g. 25 or -10"
                className="w-32 px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 font-display font-bold text-sm text-text-primary focus:outline-none focus:border-accent"
              />
              <div className="flex flex-wrap gap-1">
                {[10, 25, 50, 100, -10, -25].map((val) => (
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
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Reason / Category <span className="text-accent">*</span>
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
              Work Description / Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Cleared 15 customer escalations during surge"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Link to Work / PR / Ticket (Optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://jira.internal/... or PR link"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSelf || !memberId || isNaN(parsedPoints) || parsedPoints === 0 || awardMutation.isPending}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5',
                isSelf || !memberId || isNaN(parsedPoints) || parsedPoints === 0 || awardMutation.isPending
                  ? 'bg-surface-secondary text-text-muted cursor-not-allowed'
                  : 'bg-accent text-white hover:bg-accent-hover shadow-md shadow-accent/20',
              )}
            >
              {awardMutation.isPending ? 'Awarding…' : 'Confirm Award'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation for large adjustments */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeAward}
        title="Confirm Large Point Adjustment"
        message={`You are about to award ${parsedPoints > 0 ? '+' : ''}${parsedPoints} points to ${
          selectedMember?.name || 'this member'
        }. This exceeds the threshold of ${CONFIG.LARGE_ADJUSTMENT_THRESHOLD} points.`}
        confirmLabel="Yes, Apply Adjustment"
        variant={parsedPoints < 0 ? 'danger' : 'warning'}
      />
    </>
  );
}
