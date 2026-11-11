import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchFilter({ value, onChange, className }: SearchFilterProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        placeholder="Search members..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-lg border border-border bg-surface-secondary/50 py-2 pl-9 pr-8 text-sm text-text-primary',
          'placeholder:text-text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30',
          'transition-colors',
        )}
        aria-label="Search members"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
