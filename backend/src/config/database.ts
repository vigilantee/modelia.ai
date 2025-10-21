import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "ai_studio",
  user: "abhishekjha",
  password: "password",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const initDatabase = async () => {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create generations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS generations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        input_image_url TEXT NOT NULL,
        output_image_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'processing',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generations_user_id 
      ON generations(user_id, created_at DESC);
    `);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
