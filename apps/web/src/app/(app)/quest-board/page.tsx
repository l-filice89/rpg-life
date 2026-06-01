import { QuestBoard } from '@/components/quest-board/QuestBoard';
import { createServerTrpcClient } from '@/lib/trpc-server';

export default async function QuestBoardPage() {
  const trpc = await createServerTrpcClient();
  const [tasks, profile] = await Promise.all([
    trpc.tasks.list.query(),
    trpc.profile.get.query(),
  ]);

  return <QuestBoard tasks={tasks} profile={profile} />;
}
