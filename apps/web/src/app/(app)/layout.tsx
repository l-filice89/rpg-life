import { AppProviders } from '@/components/providers/app-providers';
import { AppShell } from '@/components/sidebar/app-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}
