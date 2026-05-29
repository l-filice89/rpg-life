import { describe, test, expect, mock, beforeEach } from 'bun:test';

// --- Mock expo-secure-store ---

const mockSetItemAsync = mock(() => Promise.resolve());
const mockDeleteItemAsync = mock(() => Promise.resolve());
const mockGetItemAsync = mock(() => Promise.resolve(null as string | null));

mock.module('expo-secure-store', () => ({
  setItemAsync: mockSetItemAsync,
  deleteItemAsync: mockDeleteItemAsync,
  getItemAsync: mockGetItemAsync,
}));

// --- Mock better-auth/react ---

const mockSignInEmail = mock(() =>
  Promise.resolve({ data: { token: 'test-token' } } as Record<string, unknown>),
);
const mockSignOut = mock(() => Promise.resolve({}));
const mockUseSession = mock(() => ({
  data: null,
  isPending: false,
  error: null,
}));

mock.module('better-auth/react', () => ({
  createAuthClient: () => ({
    signIn: { email: mockSignInEmail },
    signUp: { email: mock(() => Promise.resolve({})) },
    signOut: mockSignOut,
    useSession: mockUseSession,
    $Infer: { Session: {} },
  }),
}));

// --- Import after mocks are set up ---

const { authClient, useSession, signInAndStore, signOutAndClear, getStoredToken } =
  await import('../client.native');

describe('auth native client exports', () => {
  test('authClient is exported and defined', () => {
    expect(authClient).toBeDefined();
  });

  test('useSession is exported and is callable', () => {
    expect(useSession).toBeDefined();
    expect(typeof useSession).toBe('function');
  });
});

describe('signInAndStore', () => {
  beforeEach(() => {
    mockSignInEmail.mockClear();
    mockSetItemAsync.mockClear();
  });

  test('calls signIn.email with credentials', async () => {
    mockSignInEmail.mockImplementation(() => Promise.resolve({ data: { token: 'tok' } }));

    const creds = { email: 'user@test.com', password: 'password123' };
    await signInAndStore(creds);

    expect(mockSignInEmail).toHaveBeenCalledWith(creds);
  });

  test('stores token in SecureStore when result has token', async () => {
    mockSignInEmail.mockImplementation(() =>
      Promise.resolve({ data: { token: 'bearer-token-abc' } }),
    );

    await signInAndStore({ email: 'a@b.com', password: 'pass' });

    expect(mockSetItemAsync).toHaveBeenCalledWith('x4_auth_token', 'bearer-token-abc');
  });

  test('does NOT call SecureStore when result has no token', async () => {
    mockSignInEmail.mockImplementation(() => Promise.resolve({ data: null }));

    await signInAndStore({ email: 'a@b.com', password: 'pass' });

    expect(mockSetItemAsync).not.toHaveBeenCalled();
  });

  test('returns the sign-in result', async () => {
    mockSignInEmail.mockImplementation(() => Promise.resolve({ data: { token: 'tok-returned' } }));

    const result = await signInAndStore({ email: 'a@b.com', password: 'pass' });

    expect((result as { data: { token: string } }).data.token).toBe('tok-returned');
  });
});

describe('signOutAndClear', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockDeleteItemAsync.mockClear();
  });

  test('calls authClient.signOut', async () => {
    await signOutAndClear();

    expect(mockSignOut).toHaveBeenCalled();
  });

  test('deletes token from SecureStore', async () => {
    await signOutAndClear();

    expect(mockDeleteItemAsync).toHaveBeenCalledWith('x4_auth_token');
  });
});

describe('getStoredToken', () => {
  beforeEach(() => {
    mockGetItemAsync.mockClear();
  });

  test('calls SecureStore.getItemAsync with correct key', async () => {
    await getStoredToken();

    expect(mockGetItemAsync).toHaveBeenCalledWith('x4_auth_token');
  });

  test('returns the stored token value', async () => {
    mockGetItemAsync.mockImplementation(() => Promise.resolve('stored-token-xyz'));

    const token = await getStoredToken();

    expect(token).toBe('stored-token-xyz');
  });

  test('returns null when no token is stored', async () => {
    mockGetItemAsync.mockImplementation(() => Promise.resolve(null));

    const token = await getStoredToken();

    expect(token).toBeNull();
  });
});
