/**
 * Splits XP evenly across linked skills using floor division.
 * Any remainder XP is dropped (not awarded to any skill).
 */
export function splitXpAcrossSkills(
  xpAward: number,
  skillCodes: readonly string[],
): Record<string, number> {
  if (skillCodes.length === 0) {
    throw new Error('At least one skill is required to split XP');
  }

  const perSkill = Math.floor(xpAward / skillCodes.length);
  const result: Record<string, number> = {};

  for (const code of skillCodes) {
    result[code] = perSkill;
  }

  return result;
}
