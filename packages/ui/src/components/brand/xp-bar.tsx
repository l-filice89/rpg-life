import { cn } from '../../lib/utils';

type XpBarProps = {
  value: number;
  className?: string;
};

export function XpBar({ value, className }: XpBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const percent = `${clamped * 100}%`;

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-xp-track', className)}
      role="progressbar"
      aria-label="Hero XP progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-xp-fill-start to-xp-fill-end shadow-[0_0_12px_rgba(124,58,237,0.35)] transition-[width] duration-300"
        style={{ width: percent }}
      />
    </div>
  );
}
