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

export type GenerationStatus = 'processing' | 'completed' | 'failed';

export type StyleOption = 'realistic' | 'artistic' | 'vintage' | 'modern';

export interface Generation {
  id: number;
  status: GenerationStatus;
  prompt: string;
  style: string;
  inputImageUrl: string;
  outputImageUrl?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface CreateGenerationRequest {
  image: File;
  prompt: string;
  style: StyleOption;
}

export interface ApiError {
  error: string;
  status?: number;
}
