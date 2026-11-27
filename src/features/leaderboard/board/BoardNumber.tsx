import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { cn } from '../../../lib/utils';
import { SPRING, useBoardMotion } from './motion';

/** A score that rolls to its new value on the page spring; jumps under reduced motion. */
export function BoardNumber({ value, className }: { value: number; className?: string }) {
  const { reduced } = useBoardMotion();
  const spring = useSpring(value, SPRING);
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString('en-IN'));

  useEffect(() => {
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [value, reduced, spring]);

  return <motion.span className={cn('rb-num', className)}>{text}</motion.span>;
}
