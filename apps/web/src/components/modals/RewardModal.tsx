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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SkillChip,
  XpBar,
} from '@rpg-life/ui';
import { trpc } from '@/components/providers/app-providers';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { skillDisplayName } from '@/lib/skill-display-name';

type RewardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: RewardPayload;
  heroXpProgress: number;
  onContinue: () => void;
};

function formatXpAnnouncement(payload: RewardPayload): string {
  const skillParts = Object.entries(payload.xpPerSkill)
    .filter(([, xp]) => xp > 0)
    .map(([code, xp]) => `${skillDisplayName(code as SkillCode)} plus ${xp} XP`)
    .join(', ');

  const focusPart =
    payload.focusEarned > 0 ? ` Focus earned: ${payload.focusEarned}.` : '';

  return `Quest complete! ${skillParts}.${focusPart} Hero level ${payload.heroLevelAfter}.`;
}

function RewardContent({
  payload,
  heroXpProgress,
  reducedMotion,
  onContinue,
}: {
  payload: RewardPayload;
  heroXpProgress: number;
  reducedMotion: boolean;
  onContinue: () => void;
}) {
  const skillEntries = Object.entries(payload.xpPerSkill).filter(
    ([, xp]) => xp > 0,
  ) as [SkillCode, number][];

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {formatXpAnnouncement(payload)}
      </div>

      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-display-sm text-foreground">Quest complete!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nice work — your Hero and Skills gained XP.
          </p>
        </div>

        {skillEntries.length > 0 ? (
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Skills rewarded
            </p>
            <ul className="flex flex-col gap-3">
              {skillEntries.map(([skillCode, xp]) => (
                <li
                  key={skillCode}
                  className="flex items-center gap-3 rounded-md border bg-card px-3.5 py-3"
                >
                  <SkillChip skillCode={skillCode} className="shrink-0" />
                  <XpBar
                    value={1}
                    className="h-1.5 flex-1"
                    animateOnMount
                    reducedMotion={reducedMotion}
                    ariaLabel={`${skillDisplayName(skillCode)} XP gain`}
                  />
                  <span className="shrink-0 text-sm font-bold text-primary">+{xp} XP</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Hero <span className="font-medium text-muted-foreground">Lv {payload.heroLevelAfter}</span>
            </span>
            {payload.focusEarned > 0 ? (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                +{payload.focusEarned} Focus
              </span>
            ) : null}
          </div>
          <XpBar
            value={heroXpProgress}
            animateOnMount
            reducedMotion={reducedMotion}
          />
        </div>

        {payload.freshness ? (
          <p className="text-center text-sm text-muted-foreground">
            XP adjusted for timing — still counts toward your path.
          </p>
        ) : null}

        <Button type="button" className="min-h-[44px] w-full" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </>
  );
}

export function RewardModal({
  open,
  onOpenChange,
  payload,
  heroXpProgress,
  onContinue,
}: RewardModalProps) {
  const isDesktop = useIsDesktop();
  const reducedMotion = useReducedMotion();

  if (!open || isDesktop === null) {
    return null;
  }

  const content = (
    <RewardContent
      payload={payload}
      heroXpProgress={heroXpProgress}
      reducedMotion={reducedMotion}
      onContinue={onContinue}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Quest complete!</DialogTitle>
            <DialogDescription>{formatXpAnnouncement(payload)}</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[90vh] flex-col overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Quest complete!</SheetTitle>
        </SheetHeader>
        {content}
        <SheetFooter className="sr-only" />
      </SheetContent>
    </Sheet>
  );
}
