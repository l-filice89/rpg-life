export const testUser = {
  email: 'hero@example.com',
};

export const testQuest = {
  title: 'Train Concentration',
  difficulty: 'medium' as const,
  skillSlugs: ['concentration'],
};

export const baseUrls = {
  web: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
  api: process.env.API_URL ?? 'http://localhost:3002',
};
