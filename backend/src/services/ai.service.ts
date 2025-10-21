export interface GenerationResult {
  success: boolean;
  outputImageUrl?: string;
  error?: string;
}

export class AIService {
  private readonly ERROR_RATE = 0.2;
  private readonly MIN_DELAY = 2000;
  private readonly MAX_DELAY = 4000;

  async generateImage(inputImageUrl: string, prompt: string): Promise<GenerationResult> {
    console.log('prompt is....', prompt);
    const delay = this.getRandomDelay();
    await this.sleep(delay);

    if (this.shouldSimulateError()) {
      return {
        success: false,
        error: this.getRandomError(),
      };
    }

    return {
      success: true,
      outputImageUrl: inputImageUrl,
    };
  }

  private getRandomDelay(): number {
    return Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY) + this.MIN_DELAY);
  }

  private shouldSimulateError(): boolean {
    return Math.random() < this.ERROR_RATE;
  }

  private getRandomError(): string {
    const errors = [
      'AI model is currently overloaded. Please try again.',
      'Failed to process the image. The image format may be unsupported.',
      'Generation timeout. The request took too long to process.',
      'Rate limit exceeded. Please wait before trying again.',
      'Internal AI service error. Our team has been notified.',
    ];

    return errors[Math.floor(Math.random() * errors.length)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();
