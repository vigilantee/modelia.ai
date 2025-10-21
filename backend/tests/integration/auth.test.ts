import request from 'supertest';
import app from '../../src/index';
import { query } from '../../src/config/database';

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean up test users before tests
    await query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  afterAll(async () => {
    // Clean up after tests
    await query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test1@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test1@example.com');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should reject short password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test2@example.com',
        password: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('6 characters');
    });

    it('should reject duplicate email', async () => {
      const email = 'test3@example.com';
      const password = 'password123';

      // Register first user
      await request(app).post('/api/auth/register').send({ email, password });

      // Try to register with same email
      const response = await request(app).post('/api/auth/register').send({ email, password });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should reject missing fields', async () => {
      const response = await request(app).post('/api/auth/register').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: 'test4@example.com',
      password: 'password123',
    };

    beforeAll(async () => {
      // Create a test user
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app).post('/api/auth/login').send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should reject incorrect password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
    });

    it('should reject missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({ email: testUser.email });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Register and get token
      const response = await request(app).post('/api/auth/register').send({
        email: 'test5@example.com',
        password: 'password123',
      });

      authToken = response.body.token;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'test5@example.com');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('createdAt');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('No token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject request with malformed auth header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });
  });
});
