const DIFFICULTY_LABELS: Record<string, string> = {
  trivial: 'Trivial',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function getDifficultyLabel(difficulty: string): string {
  return DIFFICULTY_LABELS[difficulty] ?? difficulty;
}
