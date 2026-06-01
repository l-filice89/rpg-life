'use client';

import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, toast } from '@rpg-life/ui';
import { TUTORIAL_SECTIONS } from './tutorial-content';
import { trpc } from '@/components/providers/app-providers';

type TutorialMode = 'first-run' | 'replay';

type TutorialSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: TutorialMode;
};

export function TutorialSheet({ open, onOpenChange, mode }: TutorialSheetProps) {
  const markSeen = trpc.tutorial.markSeen.useMutation();

  const handleDismiss = async () => {
    if (mode === 'first-run' && markSeen.isPending) {
      return;
    }

    if (mode === 'first-run') {
      try {
        await markSeen.mutateAsync();
        onOpenChange(false);
      } catch {
        toast.error('Could not save progress. Check your connection and try again.');
      }
      return;
    }

    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && open) {
      void handleDismiss();
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tutorial</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 pb-4 pt-2">
          {TUTORIAL_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-display-sm mb-2 font-semibold">{section.title}</h2>
              <p className="text-base text-muted-foreground">{section.body}</p>
            </section>
          ))}
          <Button
            type="button"
            className="min-h-[44px] w-full"
            disabled={markSeen.isPending}
            onClick={() => void handleDismiss()}
          >
            Begin your quest
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
