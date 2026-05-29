import { db, userProgress } from '@rpg-life/db';

export async function provisionUserProgress(
  userId: string,
  database: typeof db = db,
): Promise<void> {
  await database
    .insert(userProgress)
    .values({
      userId,
      focusBalance: 0,
      tutorialSeenAt: null,
      modifiedAt: new Date().toISOString(),
    })
    .onConflictDoNothing();
}
