'use client';

import type { RewardPayload } from '@rpg-life/api';
import type { SkillCode } from '@rpg-life/validators';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  SkillChip,
  XpBar,
} from '@rpg-life/ui';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type HeroLevelUpOverlayProps = {
  open: boolean;
  payload: RewardPayload;
  heroXpProgress: number;
  onContinue: () => void;
};

const CONFETTI_DOTS = [
  { top: '8%', left: '12%', size: 6, color: 'bg-primary' },
  { top: '14%', left: '78%', size: 5, color: 'bg-accent' },
  { top: '22%', left: '45%', size: 4, color: 'bg-primary/60' },
  { top: '6%', left: '55%', size: 3, color: 'bg-foreground/30' },
  { top: '18%', left: '28%', size: 7, color: 'bg-accent/70' },
  { top: '32%', left: '8%', size: 4, color: 'bg-primary/80' },
  { top: '28%', left: '88%', size: 6, color: 'bg-primary/70' },
  { top: '38%', left: '62%', size: 5, color: 'bg-accent/50' },
  { top: '72%', left: '15%', size: 4, color: 'bg-accent/60' },
  { top: '68%', left: '82%', size: 6, color: 'bg-primary' },
  { top: '78%', left: '38%', size: 3, color: 'bg-foreground/25' },
  { top: '84%', left: '58%', size: 5, color: 'bg-accent/55' },
] as const;

function formatLevelUpAnnouncement(payload: RewardPayload): string {
  return `Level up! Hero reached level ${payload.heroLevelAfter}.`;
}

export function HeroLevelUpOverlay({
  open,
  payload,
  heroXpProgress,
  onContinue,
}: HeroLevelUpOverlayProps) {
  const reducedMotion = useReducedMotion();

  if (!open) {
    return null;
  }

  const skillEntries = Object.entries(payload.xpPerSkill).filter(
    ([, xp]) => xp > 0,
  ) as [SkillCode, number][];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onContinue();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-sm overflow-hidden border-border bg-background px-7 py-10 text-foreground sm:px-10"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Level up!</DialogTitle>
          <DialogDescription>{formatLevelUpAnnouncement(payload)}</DialogDescription>
        </DialogHeader>

        <div aria-live="polite" className="sr-only">
          {formatLevelUpAnnouncement(payload)}
        </div>

        <div className="relative flex w-full flex-col items-center gap-8">
          {!reducedMotion ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {CONFETTI_DOTS.map((dot, index) => (
                <span
                  key={index}
                  className={`absolute rounded-full opacity-55 ${dot.color}`}
                  style={{
                    top: dot.top,
                    left: dot.left,
                    width: dot.size,
                    height: dot.size,
                  }}
                />
              ))}
            </div>
          ) : null}

          <div className="relative z-10 w-full text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Level up!
            </p>
            <h2 className="text-display-sm font-extrabold">Level up!</h2>
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="rounded-md border border-border bg-muted px-4 py-2.5 text-sm font-bold text-muted-foreground">
                Hero Lv {payload.heroLevelBefore}
              </span>
              <span aria-hidden="true" className="text-muted-foreground">
                →
              </span>
              <span className="rounded-md border border-primary bg-primary/10 px-4 py-2.5 text-sm font-bold text-foreground shadow-[0_0_24px_rgba(45,212,191,0.25)]">
                Hero Lv {payload.heroLevelAfter}
              </span>
            </div>
          </div>

          <div className="relative z-10 w-full">
            <p className="mb-2.5 text-center text-sm font-semibold">
              Hero Lv {payload.heroLevelAfter}
            </p>
            <XpBar
              value={heroXpProgress}
              animateOnMount
              reducedMotion={reducedMotion}
            />
          </div>

          {skillEntries.length > 0 ? (
            <div className="relative z-10 w-full">
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Skills from this quest
              </p>
              <ul className="flex flex-col gap-2">
                {skillEntries.map(([skillCode, xp]) => (
                  <li
                    key={skillCode}
                    className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2.5"
                  >
                    <SkillChip skillCode={skillCode} />
                    <span className="ml-auto text-xs font-bold text-primary">+{xp} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button
            type="button"
            className="relative z-10 min-h-[44px] w-full max-w-sm"
            onClick={onContinue}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
