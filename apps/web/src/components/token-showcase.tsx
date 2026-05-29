'use client';

import { toast } from '@rpg-life/ui';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@rpg-life/ui';

function TokenSwatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-12 rounded-md border border-border ${className}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function TokenShowcase() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 p-8">
      <header className="space-y-2 text-center">
        <p className="text-hero-level text-primary">Crystal Path</p>
        <h1 className="text-display text-foreground">rpg-life design foundation</h1>
        <p className="text-display-sm text-muted-foreground">
          Foundation only — Quest Board lands in Epic 2
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Actions
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary teal</Button>
          <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
            Accent violet
          </Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Brand tokens
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TokenSwatch label="Focus pill" className="bg-focus-pill-bg text-focus-pill-fg" />
          <TokenSwatch label="XP track" className="bg-xp-track" />
          <TokenSwatch label="Skill chip" className="bg-skill-chip-bg" />
          <TokenSwatch label="Overdue border" className="border-2 border-overdue-border bg-card" />
        </div>
        <div className="rounded-md bg-xp-track p-1">
          <div className="h-2 rounded-full bg-gradient-to-r from-xp-fill-start to-xp-fill-end shadow-[0_0_12px_rgba(124,58,237,0.35)]" />
        </div>
        <span
          className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm"
          style={{
            backgroundColor: 'var(--focus-pill-bg)',
            color: 'var(--focus-pill-fg)',
          }}
        >
          1 Focus
        </span>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Typography
        </h2>
        <p className="text-display">Display — epic moments</p>
        <p className="text-display-sm">Display sm — celebratory headlines</p>
        <p className="text-hero-level text-primary">Hero Lv 3</p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crystal Path dialog</DialogTitle>
              <DialogDescription>
                Stock shadcn Dialog using theme tokens — no custom rebuild.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Crystal Path sheet</SheetTitle>
              <SheetDescription>
                Stock shadcn Sheet — sidebar and quest forms reuse this primitive.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>

        <Button variant="outline" onClick={() => toast('Crystal Path toast — Sonner wired.')}>
          Show Toast
        </Button>
      </section>
    </div>
  );
}
