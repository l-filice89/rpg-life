import { describe, test, expect } from 'bun:test';
import { authClient, signIn, signOut, useSession } from '../client';

describe('auth web client exports', () => {
  test('authClient is exported and defined', () => {
    expect(authClient).toBeDefined();
  });

  test('signIn exposes magicLink after magicLinkClient plugin', () => {
    expect(signIn).toBeDefined();
    expect(signIn.magicLink).toBeDefined();
    expect(typeof signIn.magicLink).toBe('function');
  });

  test('signOut is exported and is callable', () => {
    expect(signOut).toBeDefined();
    expect(typeof signOut).toBe('function');
  });

  test('useSession is exported and is callable', () => {
    expect(useSession).toBeDefined();
    expect(typeof useSession).toBe('function');
  });

  test('authClient has $Infer for type inference', () => {
    expect(authClient.$Infer).toBeDefined();
  });
});
