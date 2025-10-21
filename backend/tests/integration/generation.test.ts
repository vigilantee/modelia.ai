import request from 'supertest';
import app from '../../src/index';
import path from 'path';
import fs from 'fs';

describe('Generation API', () => {
  let authToken: string;
  let userId: number;
  const testImagePath = path.join(__dirname, 'test-image.png');
   beforeAll(async () => {
    // Register user and get token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `testgen${Date.now()}@example.com`,
        password: 'password123',
      });

    authToken = response.body.token;
    userId = response.body.user.id;

    // Create a minimal valid JPEG file (1x1 pixel)
    const buffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
      0x3F, 0x00, 0x37, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, buffer);
  });

  describe('POST /api/generations', () => {
    it('should create generation successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'A stylish fashion model')
        .field('style', 'realistic')
        .attach('image', path.join(__dirname, 'test-image.jpg'));

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.generation).toHaveProperty('id');
      expect(response.body.generation).toHaveProperty('status', 'processing');
      expect(response.body.generation).toHaveProperty('prompt', 'A stylish fashion model');
      expect(response.body.generation).toHaveProperty('style', 'realistic');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/generations')
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .attach('image', path.join(__dirname, 'test-image.jpg'));

      expect(response.status).toBe(401);
    });

    it('should reject request without image', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'realistic');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Image');
    });

    it('should reject request without prompt', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('style', 'realistic')
        .attach('image', path.join(__dirname, 'test-image.jpg'));

      expect(response.status).toBe(400);
    });

    it('should reject invalid style', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'invalid-style')
        .attach('image', path.join(__dirname, 'test-image.jpg'));

      expect(response.status).toBe(400);
    });

    it('should reject prompt that is too long', async () => {
      const longPrompt = 'a'.repeat(501);

      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', longPrompt)
        .field('style', 'realistic')
        .attach('image', path.join(__dirname, 'test-image.jpg'));

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/generations/recent', () => {
    beforeAll(async () => {
      // Create a few test generations
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', `Test prompt ${i}`)
          .field('style', 'realistic')
          .attach('image', path.join(__dirname, 'test-image.jpg'));
      }
    });

    it('should return recent generations', async () => {
      const response = await request(app)
        .get('/api/generations/recent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('generations');
      expect(Array.isArray(response.body.generations)).toBe(true);
      expect(response.body.generations.length).toBeGreaterThan(0);
      expect(response.body.generations.length).toBeLessThanOrEqual(5);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/generations/recent?limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.generations.length).toBeLessThanOrEqual(2);
    });

    it('should return generations in descending order', async () => {
      const response = await request(app)
        .get('/api/generations/recent')
        .set('Authorization', `Bearer ${authToken}`);

      const generations = response.body.generations;
      for (let i = 1; i < generations.length; i++) {
        const prev = new Date(generations[i - 1].createdAt);
        const curr = new Date(generations[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/generations/recent');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/generations/:id', () => {
    let generationId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test for get by ID')
        .field('style', 'artistic')
        .attach('image', path.join(__dirname, 'test-image.jpg'));

      generationId = response.body.generation.id;
    });

    it('should return generation by ID', async () => {
      const response = await request(app)
        .get(`/api/generations/${generationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.generation).toHaveProperty('id', generationId);
      expect(response.body.generation).toHaveProperty('prompt', 'Test for get by ID');
      expect(response.body.generation).toHaveProperty('style', 'artistic');
    });

    it('should reject invalid ID format', async () => {
      const response = await request(app)
        .get('/api/generations/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent generation', async () => {
      const response = await request(app)
        .get('/api/generations/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app).get(`/api/generations/${generationId}`);

      expect(response.status).toBe(401);
    });
  });
});
