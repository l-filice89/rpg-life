import { z } from 'zod';

export const SKILL_CODES = [
  'concentration',
  'vitality',
  'lore',
  'presence',
  'order',
  'resolve',
  'craft',
] as const;

export type SkillCode = (typeof SKILL_CODES)[number];

export const SkillCodeSchema = z.enum(SKILL_CODES);

export const SKILL_CATALOG = [
  { code: 'concentration', displayName: 'Concentration', sortOrder: 1, iconKey: 'Target' },
  { code: 'vitality', displayName: 'Vitality', sortOrder: 2, iconKey: 'HeartPulse' },
  { code: 'lore', displayName: 'Lore', sortOrder: 3, iconKey: 'BookOpen' },
  { code: 'presence', displayName: 'Presence', sortOrder: 4, iconKey: 'Users' },
  { code: 'order', displayName: 'Order', sortOrder: 5, iconKey: 'LayoutList' },
  { code: 'resolve', displayName: 'Resolve', sortOrder: 6, iconKey: 'Shield' },
  { code: 'craft', displayName: 'Craft', sortOrder: 7, iconKey: 'Hammer' },
] as const satisfies ReadonlyArray<{
  code: SkillCode;
  displayName: string;
  sortOrder: number;
  iconKey: string;
}>;
