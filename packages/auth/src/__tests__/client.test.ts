import { describe, test, expect } from 'bun:test';
import { authClient, signIn, signUp, signOut, useSession } from '../client';

describe('auth web client exports', () => {
  test('authClient is exported and defined', () => {
    expect(authClient).toBeDefined();
  });

  test('signIn is exported and has email method', () => {
    expect(signIn).toBeDefined();
    expect(signIn.email).toBeDefined();
  });

  test('signUp is exported and has email method', () => {
    expect(signUp).toBeDefined();
    expect(signUp.email).toBeDefined();
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
