import { useEffect, useRef } from 'react';
import { useSpring, useTransform, motion } from 'motion/react';
import { cn } from '../../lib/utils';

export interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({ value, className, format }: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => {
    const rounded = Math.round(v);
    return format ? format(rounded) : rounded.toLocaleString('en-IN');
  });
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // Animate from 0 on first render
      isFirstRender.current = false;
      spring.set(0);
      // Small delay so the animation is visible
      requestAnimationFrame(() => spring.set(value));
    } else {
      spring.set(value);
    }
  }, [value, spring]);

  return (
    <motion.span className={cn('font-display tabular-nums', className)}>
      {display}
    </motion.span>
  );
}
