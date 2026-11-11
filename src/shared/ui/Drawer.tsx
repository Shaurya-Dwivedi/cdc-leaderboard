import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const slideVariants = isDesktop
    ? {
        initial: { x: '100%', y: 0 },
        animate: { x: 0, y: 0 },
        exit: { x: '100%', y: 0 },
      }
    : {
        initial: { y: '100%', x: 0 },
        animate: { y: 0, x: 0 },
        exit: { y: '100%', x: 0 },
      };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Desktop: right side drawer, Mobile: bottom sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'absolute bg-surface-card border-l border-border shadow-2xl overflow-y-auto',
              'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl',
              'md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-[480px] md:max-h-full md:rounded-t-none md:rounded-l-2xl',
              className,
            )}
            initial={slideVariants.initial}
            animate={slideVariants.animate}
            exit={slideVariants.exit}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-card px-6 py-4">
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
