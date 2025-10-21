import { query } from "../config/database";

export type GenerationStatus = "processing" | "completed" | "failed";

export interface Generation {
  id: number;
  user_id: number;
  prompt: string;
  style: string;
  input_image_url: string;
  output_image_url: string | null;
  status: GenerationStatus;
  error_message: string | null;
  retry_count: number;
  created_at: Date;
  completed_at: Date | null;
}

export interface CreateGenerationDTO {
  userId: number;
  prompt: string;
  style: string;
  inputImageUrl: string;
}

export interface UpdateGenerationDTO {
  status: GenerationStatus;
  outputImageUrl?: string;
  errorMessage?: string;
  retryCount?: number;
}

export const GenerationModel = {
  async create(data: CreateGenerationDTO): Promise<Generation> {
    const result = await query(
      `INSERT INTO generations (user_id, prompt, style, input_image_url, status) 
       VALUES ($1, $2, $3, $4, 'processing') 
       RETURNING *`,
      [data.userId, data.prompt, data.style, data.inputImageUrl]
    );

    return result.rows[0];
  },

  async findById(id: number): Promise<Generation | null> {
    const result = await query("SELECT * FROM generations WHERE id = $1", [id]);

    return result.rows[0] || null;
  },

  async findByUserId(userId: number, limit: number = 5): Promise<Generation[]> {
    const result = await query(
      `SELECT * FROM generations 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  },

  async update(id: number, data: UpdateGenerationDTO): Promise<Generation> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.status) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (data.outputImageUrl) {
      updates.push(`output_image_url = $${paramCount++}`);
      values.push(data.outputImageUrl);
    }

    if (data.errorMessage !== undefined) {
      updates.push(`error_message = $${paramCount++}`);
      values.push(data.errorMessage);
    }

    if (data.retryCount !== undefined) {
      updates.push(`retry_count = $${paramCount++}`);
      values.push(data.retryCount);
    }

    if (data.status === "completed" || data.status === "failed") {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    values.push(id);

    const result = await query(
      `UPDATE generations 
       SET ${updates.join(", ")} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(id: number): Promise<void> {
    await query("DELETE FROM generations WHERE id = $1", [id]);
  },
};
