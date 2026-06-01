import { QuestBoard } from '@/components/quest-board/QuestBoard';
import { createServerTrpcClient } from '@/lib/trpc-server';

export default async function QuestBoardPage() {
  const trpc = await createServerTrpcClient();
  const tasks = await trpc.tasks.list.query();

  return <QuestBoard tasks={tasks} />;
}
