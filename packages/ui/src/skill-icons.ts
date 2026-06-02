import {
  BookOpen,
  Hammer,
  HeartPulse,
  LayoutList,
  Shield,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { SKILL_CATALOG, type SkillCode } from '@rpg-life/validators';

/** Neutral fallback icon for an unknown or missing skill icon key. */
export const FallbackSkillIcon: LucideIcon = Sparkles;

const ICON_BY_KEY: Record<string, LucideIcon> = {
  Target,
  HeartPulse,
  BookOpen,
  Users,
  LayoutList,
  Shield,
  Hammer,
};

const skillIconMap = Object.fromEntries(
  SKILL_CATALOG.map((skill) => [skill.code, ICON_BY_KEY[skill.iconKey]]),
) as Record<SkillCode, LucideIcon>;

export function getSkillIcon(skillCode: SkillCode): LucideIcon {
  const icon = skillIconMap[skillCode];
  if (!icon) {
    throw new Error(`Unknown skill code: ${skillCode}`);
  }
  return icon;
}

/**
 * Resolve a Lucide icon from a DB-provided icon key.
 * Returns undefined for null or unrecognized keys so callers can fall back
 * to a default icon instead of throwing.
 */
export function getIconByKey(iconKey: string | null): LucideIcon | undefined {
  if (!iconKey) {
    return undefined;
  }
  return ICON_BY_KEY[iconKey];
}
