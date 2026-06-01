import { AppProviders } from '@/components/providers/app-providers';
import { AppShell } from '@/components/sidebar/app-shell';
import { createServerTrpcClient } from '@/lib/trpc-server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const trpc = await createServerTrpcClient();
  const status = await trpc.tutorial.getStatus.query();

  return (
    <AppProviders>
      <AppShell initialTutorialSeen={status.seen}>{children}</AppShell>
    </AppProviders>
  );
}
