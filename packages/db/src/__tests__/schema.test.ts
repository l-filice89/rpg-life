import { describe, test, expect } from 'bun:test';
import {
  users,
  user,
  session,
  account,
  verification,
  projects,
  aiUsageLog,
  userRoleEnum,
  usersRelations,
  projectsRelations,
  aiUsageLogRelations,
} from '../schema';
import { getTableName, getTableColumns } from 'drizzle-orm';

// --- Schema exports ---
describe('Schema exports', () => {
  test('all tables are exported', () => {
    expect(users).toBeDefined();
    expect(session).toBeDefined();
    expect(account).toBeDefined();
    expect(verification).toBeDefined();
    expect(projects).toBeDefined();
    expect(aiUsageLog).toBeDefined();
  });

  test('user is an alias for users table', () => {
    expect(user).toBe(users);
  });

  test('userRoleEnum is exported with correct values', () => {
    expect(userRoleEnum).toBeDefined();
    expect(userRoleEnum.enumValues).toEqual(['user', 'admin']);
  });

  test('all relations are exported', () => {
    expect(usersRelations).toBeDefined();
    expect(projectsRelations).toBeDefined();
    expect(aiUsageLogRelations).toBeDefined();
  });
});

// --- Users table ---
describe('Users table', () => {
  test('has correct SQL table name', () => {
    expect(getTableName(users)).toBe('users');
  });

  test('has all expected columns', () => {
    const columns = getTableColumns(users);
    const columnNames = Object.keys(columns);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('passwordHash');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('emailVerified');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('updatedAt');
    expect(columnNames).toHaveLength(8);
  });

  test('id is UUID type', () => {
    const columns = getTableColumns(users);
    expect(columns.id.dataType).toBe('string');
    expect(columns.id.notNull).toBe(true);
  });

  test('email is unique and not null', () => {
    const columns = getTableColumns(users);
    expect(columns.email.isUnique).toBe(true);
    expect(columns.email.notNull).toBe(true);
  });

  test('name is not null', () => {
    const columns = getTableColumns(users);
    expect(columns.name.notNull).toBe(true);
  });

  test('role is not null and has a default', () => {
    const columns = getTableColumns(users);
    expect(columns.role.notNull).toBe(true);
    expect(columns.role.hasDefault).toBe(true);
  });

  test('emailVerified is not null and defaults to false', () => {
    const columns = getTableColumns(users);
    expect(columns.emailVerified.notNull).toBe(true);
    expect(columns.emailVerified.hasDefault).toBe(true);
  });

  test('createdAt and updatedAt are not null with defaults', () => {
    const columns = getTableColumns(users);
    expect(columns.createdAt.notNull).toBe(true);
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.notNull).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });
});

// --- Projects table ---
describe('Projects table', () => {
  test('has correct SQL table name', () => {
    expect(getTableName(projects)).toBe('projects');
  });

  test('has all expected columns', () => {
    const columns = getTableColumns(projects);
    const columnNames = Object.keys(columns);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('ownerId');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('updatedAt');
    expect(columnNames).toHaveLength(7);
  });

  test('id is UUID type', () => {
    const columns = getTableColumns(projects);
    expect(columns.id.dataType).toBe('string');
    expect(columns.id.notNull).toBe(true);
  });

  test('ownerId is not null', () => {
    const columns = getTableColumns(projects);
    expect(columns.ownerId.notNull).toBe(true);
  });

  test('name is not null', () => {
    const columns = getTableColumns(projects);
    expect(columns.name.notNull).toBe(true);
  });

  test('status is not null with default', () => {
    const columns = getTableColumns(projects);
    expect(columns.status.notNull).toBe(true);
    expect(columns.status.hasDefault).toBe(true);
  });

  test('description is optional (nullable)', () => {
    const columns = getTableColumns(projects);
    expect(columns.description.notNull).toBe(false);
  });
});

// --- AI Usage Log table ---
describe('AI Usage Log table', () => {
  test('has correct SQL table name', () => {
    expect(getTableName(aiUsageLog)).toBe('ai_usage_log');
  });

  test('has all expected columns', () => {
    const columns = getTableColumns(aiUsageLog);
    const columnNames = Object.keys(columns);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('userId');
    expect(columnNames).toContain('model');
    expect(columnNames).toContain('tokensUsed');
    expect(columnNames).toContain('estimatedCost');
    expect(columnNames).toContain('endpoint');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toHaveLength(7);
  });

  test('tokensUsed is integer type (not varchar)', () => {
    const columns = getTableColumns(aiUsageLog);
    expect(columns.tokensUsed.dataType).toBe('number');
    expect(columns.tokensUsed.notNull).toBe(true);
  });

  test('estimatedCost is numeric type', () => {
    const columns = getTableColumns(aiUsageLog);
    expect(columns.estimatedCost.dataType).toBe('string');
  });

  test('has no updatedAt column (append-only log)', () => {
    const columns = getTableColumns(aiUsageLog);
    expect(Object.keys(columns)).not.toContain('updatedAt');
  });

  test('userId is not null', () => {
    const columns = getTableColumns(aiUsageLog);
    expect(columns.userId.notNull).toBe(true);
  });

  test('model is not null', () => {
    const columns = getTableColumns(aiUsageLog);
    expect(columns.model.notNull).toBe(true);
  });
});

// --- Session table (Better Auth) ---
describe('Session table', () => {
  test('has correct SQL table name', () => {
    expect(getTableName(session)).toBe('session');
  });

  test('has all expected columns', () => {
    const columns = getTableColumns(session);
    const columnNames = Object.keys(columns);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('expiresAt');
    expect(columnNames).toContain('token');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('updatedAt');
    expect(columnNames).toContain('ipAddress');
    expect(columnNames).toContain('userAgent');
    expect(columnNames).toContain('userId');
    expect(columnNames).toHaveLength(8);
  });

  test('id is varchar with default', () => {
    const columns = getTableColumns(session);
    expect(columns.id.dataType).toBe('string');
    expect(columns.id.notNull).toBe(true);
    expect(columns.id.hasDefault).toBe(true);
  });

  test('token is unique and not null', () => {
    const columns = getTableColumns(session);
    expect(columns.token.isUnique).toBe(true);
    expect(columns.token.notNull).toBe(true);
  });

  test('expiresAt is not null', () => {
    const columns = getTableColumns(session);
    expect(columns.expiresAt.notNull).toBe(true);
  });

  test('userId is not null', () => {
    const columns = getTableColumns(session);
    expect(columns.userId.notNull).toBe(true);
  });

  test('ipAddress and userAgent are optional', () => {
    const columns = getTableColumns(session);
    expect(columns.ipAddress.notNull).toBe(false);
    expect(columns.userAgent.notNull).toBe(false);
  });

  test('createdAt and updatedAt are not null with defaults', () => {
    const columns = getTableColumns(session);
    expect(columns.createdAt.notNull).toBe(true);
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.notNull).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });
});

// --- Account table (Better Auth) ---
describe('Account table', () => {
  test('has correct SQL table name', () => {
    expect(getTableName(account)).toBe('account');
  });

  test('has all expected columns', () => {
    const columns = getTableColumns(account);
    const columnNames = Object.keys(columns);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('accountId');
    expect(columnNames).toContain('providerId');
    expect(columnNames).toContain('userId');
    expect(columnNames).toContain('accessToken');
    expect(columnNames).toContain('refreshToken');
    expect(columnNames).toContain('idToken');
    expect(columnNames).toContain('accessTokenExpiresAt');
    expect(columnNames).toContain('refreshTokenExpiresAt');
    expect(columnNames).toContain('scope');
    expect(columnNames).toContain('password');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('updatedAt');
    expect(columnNames).toHaveLength(13);
  });

  test('id is varchar with default', () => {
    const columns = getTableColumns(account);
    expect(columns.id.dataType).toBe('string');
    expect(columns.id.notNull).toBe(true);
    expect(columns.id.hasDefault).toBe(true);
  });

  test('accountId and providerId are not null', () => {
    const columns = getTableColumns(account);
    expect(columns.accountId.notNull).toBe(true);
    expect(columns.providerId.notNull).toBe(true);
  });

  test('userId is not null', () => {
    const columns = getTableColumns(account);
    expect(columns.userId.notNull).toBe(true);
  });

  test('token fields are optional', () => {
    const columns = getTableColumns(account);
    expect(columns.accessToken.notNull).toBe(false);
    expect(columns.refreshToken.notNull).toBe(false);
    expect(columns.idToken.notNull).toBe(false);
  });

  test('createdAt and updatedAt are not null with defaults', () => {
    const columns = getTableColumns(account);
    expect(columns.createdAt.notNull).toBe(true);
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.notNull).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });
});

// --- Verification table (Better Auth) ---
describe('Verification table', () => {
  test('has correct SQL table name', () => {
    expect(getTableName(verification)).toBe('verification');
  });

  test('has all expected columns', () => {
    const columns = getTableColumns(verification);
    const columnNames = Object.keys(columns);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('identifier');
    expect(columnNames).toContain('value');
    expect(columnNames).toContain('expiresAt');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('updatedAt');
    expect(columnNames).toHaveLength(6);
  });

  test('id is varchar with default', () => {
    const columns = getTableColumns(verification);
    expect(columns.id.dataType).toBe('string');
    expect(columns.id.notNull).toBe(true);
    expect(columns.id.hasDefault).toBe(true);
  });

  test('identifier and value are not null', () => {
    const columns = getTableColumns(verification);
    expect(columns.identifier.notNull).toBe(true);
    expect(columns.value.notNull).toBe(true);
  });

  test('expiresAt is not null', () => {
    const columns = getTableColumns(verification);
    expect(columns.expiresAt.notNull).toBe(true);
  });

  test('createdAt and updatedAt have defaults', () => {
    const columns = getTableColumns(verification);
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });
});
