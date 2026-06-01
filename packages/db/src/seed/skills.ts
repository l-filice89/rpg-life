import { sql } from 'drizzle-orm';
import { SKILL_CATALOG } from '@rpg-life/validators';
import type { Database } from '../client';
import { skills } from '../schema/skills';

export async function seedSkills(db: Database) {
  await db
    .insert(skills)
    .values(
      SKILL_CATALOG.map((skill) => ({
        code: skill.code,
        displayName: skill.displayName,
        sortOrder: skill.sortOrder,
        iconKey: skill.iconKey,
        description: null,
      })),
    )
    .onConflictDoUpdate({
      target: skills.code,
      set: {
        displayName: sql`excluded.display_name`,
        sortOrder: sql`excluded.sort_order`,
        iconKey: sql`excluded.icon_key`,
      },
    });
}
