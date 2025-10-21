export interface User {
  id: number;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export type GenerationStatus = "processing" | "completed" | "failed";

export interface Generation {
  id: number;
  status: GenerationStatus;
  prompt: string;
  inputImageUrl: string;
  outputImageUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateGenerationRequest {
  image: File;
  prompt: string;
}

export interface ApiError {
  error: string;
  status?: number;
}
