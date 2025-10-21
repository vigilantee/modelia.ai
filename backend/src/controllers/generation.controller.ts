import { Response } from "express";
import { GenerationModel } from "../models/generation.model";
import { aiService } from "../services/ai.service";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { z } from "zod";

const createGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(500, "Prompt too long"),
});

export const GenerationController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError(400, "Image file is required");
    }

    const validation = createGenerationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const { prompt } = validation.data;
    const userId = req.user!.userId;

    const inputImageUrl = `/uploads/${req.file.filename}`;

    const generation = await GenerationModel.create({
      userId,
      prompt,
      inputImageUrl,
    });

    res.status(201).json({
      message: "Generation started",
      generation: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
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
        inputImageUrl: generation.input_image_url,
        outputImageUrl: generation.output_image_url,
        errorMessage: generation.error_message,
        createdAt: generation.created_at,
        completedAt: generation.completed_at,
      },
    });
  }),

  getRecent: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const generations = await GenerationModel.findByUserId(userId, 5);

    res.json({
      generations: generations.map((g) => ({
        id: g.id,
        status: g.status,
        prompt: g.prompt,
        inputImageUrl: g.input_image_url,
        outputImageUrl: g.output_image_url,
        errorMessage: g.error_message,
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
