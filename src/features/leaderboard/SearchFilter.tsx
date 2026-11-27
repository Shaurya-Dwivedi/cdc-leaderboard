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
      <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        placeholder="Search members..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full border-0 border-b bg-transparent pl-6 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        aria-label="Search members"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="rb-btn-icon absolute right-0 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
