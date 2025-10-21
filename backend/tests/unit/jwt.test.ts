import { generateToken, verifyToken } from '../../src/utils/jwt.utils';

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken({ userId: 1, email: 'test1@example.com' });
      const token2 = generateToken({ userId: 2, email: 'test2@example.com' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for tampered token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => {
        verifyToken(tamperedToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        verifyToken('not.a.valid.jwt');
      }).toThrow();
    });
  });
});
