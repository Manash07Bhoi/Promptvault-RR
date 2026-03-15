import { describe, it, expect } from 'vitest';
import { serializeUser, serializeUserAdmin } from '../lib/serialize';
import type { usersTable } from '@workspace/db';

type UserRow = typeof usersTable.$inferSelect;

describe('serialize', () => {
  const mockDate = new Date('2024-01-01T12:00:00Z');

  const mockUserRow: UserRow = {
    id: 'user_123',
    email: 'test@example.com',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'A test user bio',
    role: 'user',
    status: 'active',
    passwordHash: 'hashed_password_12345',
    refreshToken: 'refresh_token_abcde',
    stripeCustomerId: 'cus_12345',
    emailVerificationToken: 'email_token_xyz',
    emailVerifiedAt: mockDate,
    resetPasswordToken: 'reset_token_67890',
    resetPasswordExpiresAt: mockDate,
    lastLoginAt: mockDate,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  describe('serializeUser', () => {
    it('should include only safe public fields', () => {
      const result = serializeUser(mockUserRow);

      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'A test user bio',
        role: 'user',
        status: 'active',
        emailVerifiedAt: mockDate.toISOString(),
        createdAt: mockDate.toISOString(),
      });
    });

    it('should NEVER include sensitive fields or PII', () => {
      const result = serializeUser(mockUserRow) as any;

      expect(result.passwordHash).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
      expect(result.resetPasswordToken).toBeUndefined();
      expect(result.resetPasswordExpiresAt).toBeUndefined();
      expect(result.emailVerificationToken).toBeUndefined();
      expect(result.stripeCustomerId).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
      expect(result.lastLoginAt).toBeUndefined();
    });

    it('should handle null optional fields correctly', () => {
      const mockUserRowNulls: UserRow = {
        ...mockUserRow,
        emailVerifiedAt: null,
      };

      const result = serializeUser(mockUserRowNulls);

      expect(result.emailVerifiedAt).toBeNull();
    });
  });

  describe('serializeUserAdmin', () => {
    it('should include safe public fields and safe admin fields', () => {
      const result = serializeUserAdmin(mockUserRow);

      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'user',
        status: 'active',
        emailVerifiedAt: mockDate.toISOString(),
        lastLoginAt: mockDate.toISOString(),
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
      });
    });

    it('should NEVER include sensitive credentials like password hashes', () => {
      const result = serializeUserAdmin(mockUserRow) as any;

      expect(result.passwordHash).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
      expect(result.resetPasswordToken).toBeUndefined();
      expect(result.stripeCustomerId).toBeUndefined();
    });

    it('should handle null optional fields correctly', () => {
      const mockUserRowNulls: UserRow = {
        ...mockUserRow,
        emailVerifiedAt: null,
        lastLoginAt: null,
      };

      const result = serializeUserAdmin(mockUserRowNulls);

      expect(result.emailVerifiedAt).toBeNull();
      expect(result.lastLoginAt).toBeNull();
    });
  });
});
