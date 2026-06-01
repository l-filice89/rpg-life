'use client';

import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

type XpBarProps = {
  value: number;
  className?: string;
  animateOnMount?: boolean;
  reducedMotion?: boolean;
  /** Duration in ms when animateOnMount is true. Defaults to 400. */
  animationDurationMs?: number;
  ariaLabel?: string;
};

export function XpBar({
  value,
  className,
  animateOnMount = false,
  reducedMotion = false,
  animationDurationMs = 400,
  ariaLabel = 'Hero XP progress',
}: XpBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const targetPercent = `${clamped * 100}%`;
  const shouldAnimate = animateOnMount && !reducedMotion;

  const [width, setWidth] = useState(shouldAnimate ? '0%' : targetPercent);
  const [ariaValue, setAriaValue] = useState(
    shouldAnimate ? 0 : Math.round(clamped * 100),
  );

  useEffect(() => {
    if (!shouldAnimate) {
      setWidth(targetPercent);
      setAriaValue(Math.round(clamped * 100));
      return;
    }

    const frame = requestAnimationFrame(() => {
      setWidth(targetPercent);
    });

    const timeout = window.setTimeout(() => {
      setAriaValue(Math.round(clamped * 100));
    }, animationDurationMs);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [shouldAnimate, targetPercent, clamped, animationDurationMs]);

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-xp-track', className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ariaValue}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-xp-fill-start to-xp-fill-end shadow-[0_0_12px_rgba(124,58,237,0.35)]',
          shouldAnimate
            ? 'transition-[width] ease-out'
            : 'transition-[width] duration-300',
        )}
        style={{
          width,
          ...(shouldAnimate ? { transitionDuration: `${animationDurationMs}ms` } : undefined),
        }}
      />
    </div>
  );
}
