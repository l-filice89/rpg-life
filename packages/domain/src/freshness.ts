export type FreshnessInput = {
  dueDate: Date | null;
  createdAt: Date;
  completedAt: Date;
  timezone: string;
};

export function computeFreshness(_input: FreshnessInput): number {
  throw new Error('Not implemented');
}
