import { SKILL_CATALOG, type SkillCode } from '@rpg-life/validators';

export function skillDisplayName(skillCode: SkillCode): string {
  return SKILL_CATALOG.find((skill) => skill.code === skillCode)?.displayName ?? skillCode;
}
