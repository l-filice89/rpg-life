import { ProfileStats } from '@/components/profile/ProfileStats';
import { createServerTrpcClient } from '@/lib/trpc-server';

export default async function ProfilePage() {
  const trpc = await createServerTrpcClient();
  const profile = await trpc.profile.get.query();
  return <ProfileStats profile={profile} />;
}
