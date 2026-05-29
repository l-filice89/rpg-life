'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@rpg-life/ui';

const NAV_LINKS = [
  {
    label: 'Quest Board',
    href: '/quest-board',
    isActive: (pathname: string) => pathname === '/quest-board' || pathname === '/',
  },
  {
    label: 'My Profile',
    href: '/profile',
    isActive: (pathname: string) => pathname.startsWith('/profile'),
  },
] as const;

type SidebarOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTutorialClick?: () => void;
};

export function SidebarOverlay({ open, onOpenChange, onTutorialClick }: SidebarOverlayProps) {
  const pathname = usePathname();

  const handleTutorialClick = () => {
    onTutorialClick?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" id="main-navigation" className="w-[min(100%,20rem)] bg-card">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1 pt-4">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex min-h-[44px] items-center rounded-md px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      item.isActive(pathname) && 'bg-accent font-medium text-accent-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={handleTutorialClick}
                className="flex min-h-[44px] w-full items-center rounded-md px-3 text-left text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Tutorial
              </button>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
