import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { generateToken } from "../utils/jwt.utils";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
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
      throw new AppError(409, "User with this email already exists");
    }

    const user = await UserModel.create({ email, password });

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      message: "User registered successfully",
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
      throw new AppError(401, "Invalid email or password");
    }

    const isPasswordValid = await UserModel.verifyPassword(
      password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new AppError(401, "Invalid email or password");
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: "Login successful",
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
      throw new AppError(404, "User not found");
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
