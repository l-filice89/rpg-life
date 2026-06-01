import {
  BookOpen,
  Hammer,
  HeartPulse,
  LayoutList,
  Shield,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { SKILL_CATALOG, type SkillCode } from '@rpg-life/validators';

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
