import jwt, { SignOptions } from 'jsonwebtoken'; // Import SignOptions

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: number;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  // Define options with the correct type (SignOptions)
  const options: SignOptions = {
    // eslint-disable-next-line
    expiresIn: JWT_EXPIRES_IN,
  };

  // No 'as any' needed. TypeScript infers the correct types.
  return jwt.sign(
    payload, // Type: TokenPayload (compatible with object)
    JWT_SECRET, // Type: string
    options // Type: SignOptions
  );
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    // This is generally correct, but ensure the return type is handled if not using 'as'
    // The 'as TokenPayload' cast here is acceptable if you are certain of the token's payload structure.
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
