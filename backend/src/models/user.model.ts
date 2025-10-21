import { query } from "../config/database";
import bcrypt from "bcrypt";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
}

export const UserModel = {
  async create(data: CreateUserDTO): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
      [data.email, passwordHash]
    );

    return result.rows[0];
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);

    return result.rows[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);

    return result.rows[0] || null;
  },

  async verifyPassword(
    password: string,
    passwordHash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  },

  async exists(email: string): Promise<boolean> {
    const result = await query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
      [email]
    );

    return result.rows[0].exists;
  },
};
