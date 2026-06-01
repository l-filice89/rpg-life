import { cn } from '../../lib/utils';

type FocusPillProps = {
  balance: number;
  cap: number;
  className?: string;
};

export function FocusPill({ balance, cap, className }: FocusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-focus-pill-bg px-3.5 py-1.5 text-[13px] font-semibold text-focus-pill-fg',
        className,
      )}
    >
      ⚡ {balance}/{cap}
    </span>
  );
}
