import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import * as jwtUtils from '../utils/jwt.utils'; // FIX: Import entire module as jwtUtils
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { z } from 'zod';

// Define the interface for the authenticated request object
interface AuthRequest extends Request {
  user: {
    userId: number; // Based on the usage: req.user.userId
    email: string; // Typically present in the token payload
  };
}

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    const user = await UserModel.create({ email, password });

    const token = jwtUtils.generateToken({
      // FIX: Access function via jwtUtils module
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = jwtUtils.generateToken({
      // FIX: Access function via jwtUtils module
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  }),

  // FIX: Use AuthRequest interface instead of 'any'
  // eslint-disable-next-line
  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  }),
};
