import { useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { useAddMember } from '../../hooks/useMembers';
import { UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddMemberModal({ open, onClose }: AddMemberModalProps) {
  const addMember = useAddMember();
  const [name, setName] = useState('');

  const canSubmit = name.trim() !== '' && !addMember.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    addMember.mutate(name, {
      onSuccess: () => {
        setName('');
        onClose();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Member" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Full Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            autoFocus
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aarav Mehta"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
          />
          <p className="text-[11px] text-text-muted mt-1">
            Added as a regular member. Admin access is granted separately in Supabase.
          </p>
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5',
              canSubmit
                ? 'bg-accent text-white hover:bg-accent-hover shadow-md shadow-accent/20'
                : 'bg-surface-secondary text-text-muted cursor-not-allowed',
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {addMember.isPending ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
