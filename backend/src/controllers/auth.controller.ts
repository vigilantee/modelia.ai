import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt.utils';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const validation = registerSchema.validate(req.body);
    if (validation.error) {
      throw new AppError(400, validation.error.details[0].message);
    }

    const { email, password } = validation.value;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    const user = await UserModel.create({ email, password });

    const token = generateToken({
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
    const validation = loginSchema.validate(req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error!.details[0].message);
    }

    const { email, password } = validation.value;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await UserModel.verifyPassword(
      password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = generateToken({
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

  me: asyncHandler(async (req: any, res: Response) => {
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
