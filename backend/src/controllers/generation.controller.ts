import { Response } from "express";
import { GenerationModel } from "../models/generation.model";
import { aiService } from "../services/ai.service";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import Joi from "joi";

const createGenerationSchema = Joi.object({
  prompt: Joi.string().min(1).max(500).required(),
  style: Joi.string()
    .valid("realistic", "artistic", "vintage", "modern")
    .required(),
});

export const GenerationController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError(400, "Image file is required");
    }

    const validation = createGenerationSchema.validate(req.body);
    if (validation.error) {
      throw new AppError(400, validation.error.details[0].message);
    }

    const { prompt, style } = validation.value;
    const userId = req.user!.userId;

    const inputImageUrl = `/uploads/${req.file.filename}`;

    const generation = await GenerationModel.create({
      userId,
      prompt,
      style,
      inputImageUrl,
    });

    res.status(201).json({
      message: "Generation started",
      generation: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
        style: generation.style,
        inputImageUrl: generation.input_image_url,
        createdAt: generation.created_at,
      },
    });

    processGeneration(generation.id, inputImageUrl, prompt);
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const generationId = parseInt(req.params.id);

    if (isNaN(generationId)) {
      throw new AppError(400, "Invalid generation ID");
    }

    const generation = await GenerationModel.findById(generationId);

    if (!generation) {
      throw new AppError(404, "Generation not found");
    }

    if (generation.user_id !== req.user!.userId) {
      throw new AppError(403, "Access denied");
    }

    res.json({
      generation: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
        style: generation.style,
        inputImageUrl: generation.input_image_url,
        outputImageUrl: generation.output_image_url,
        errorMessage: generation.error_message,
        retryCount: generation.retry_count,
        createdAt: generation.created_at,
        completedAt: generation.completed_at,
      },
    });
  }),

  getRecent: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 5;
    const generations = await GenerationModel.findByUserId(userId, limit);

    res.json({
      generations: generations.map((g) => ({
        id: g.id,
        status: g.status,
        prompt: g.prompt,
        style: g.style,
        inputImageUrl: g.input_image_url,
        outputImageUrl: g.output_image_url,
        errorMessage: g.error_message,
        retryCount: g.retry_count,
        createdAt: g.created_at,
        completedAt: g.completed_at,
      })),
    });
  }),
};

async function processGeneration(
  generationId: number,
  inputImageUrl: string,
  prompt: string
): Promise<void> {
  try {
    const result = await aiService.generateImage(inputImageUrl, prompt);

    if (result.success) {
      await GenerationModel.update(generationId, {
        status: "completed",
        outputImageUrl: result.outputImageUrl,
      });
    } else {
      await GenerationModel.update(generationId, {
        status: "failed",
        errorMessage: result.error,
      });
    }
  } catch (error) {
    console.error("Error processing generation:", error);

    await GenerationModel.update(generationId, {
      status: "failed",
      errorMessage: "Unexpected error during processing",
    });
  }
}
