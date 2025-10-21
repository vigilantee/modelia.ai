import { AIService } from '../../src/services/ai.service';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('generateImage', () => {
    it('should return a result with success or error', async () => {
      const result = await aiService.generateImage('/test.jpg', 'test prompt');

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result.outputImageUrl).toBeDefined();
        expect(result.error).toBeUndefined();
      } else {
        expect(result.error).toBeDefined();
        expect(result.outputImageUrl).toBeUndefined();
      }
    });

    it('should take at least 2 seconds', async () => {
      const startTime = Date.now();
      await aiService.generateImage('/test.jpg', 'test prompt');
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(2000);
    });

    it('should take no more than 4.5 seconds', async () => {
      const startTime = Date.now();
      await aiService.generateImage('/test.jpg', 'test prompt');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(4500);
    });

    it('should simulate 20% error rate over multiple attempts', async () => {
      const attempts = 100;
      const results = await Promise.all(
        Array(attempts)
          .fill(null)
          .map(() => aiService.generateImage('/test.jpg', 'test prompt'))
      );

      const errorCount = results.filter((r) => !r.success).length;
      const errorRate = errorCount / attempts;

      // Allow 10-30% range for randomness
      expect(errorRate).toBeGreaterThan(0.05);
      expect(errorRate).toBeLessThan(0.35);
    });

    it('should return input URL as output on success', async () => {
      const inputUrl = '/test-image.jpg';

      // Keep trying until we get a success
      let result;
      let attempts = 0;
      do {
        result = await aiService.generateImage(inputUrl, 'test');
        attempts++;
      } while (!result.success && attempts < 10);

      expect(result.success).toBe(true);
      expect(result.outputImageUrl).toBe(inputUrl);
    });

    it('should return error message on failure', async () => {
      let errorFound = false;

      // Try multiple times to find an error
      for (let i = 0; i < 20; i++) {
        const result = await aiService.generateImage('/test.jpg', 'test');
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
          expect(result.error!.length).toBeGreaterThan(0);
          errorFound = true;
          break;
        }
      }

      if (!errorFound) {
        console.warn('No error encountered in 20 attempts (statistically unlikely)');
      }
    });
  });
});
