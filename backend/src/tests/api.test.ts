import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { AppError } from '../errors.js';
import { authRoutes } from '../routes/auth.js';
import { linksRoutes } from '../routes/links.js';
import { analyticsRoutes } from '../routes/analytics.js';
import { redirectRoutes } from '../routes/redirect.js';
import { prisma } from '../db.js';

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });
  await app.register(rateLimit, { global: false });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message || 'Validation failed' },
      });
    }
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  });

  await app.register(authRoutes);
  await app.register(linksRoutes);
  await app.register(analyticsRoutes);
  await app.register(redirectRoutes);
  return app;
}

const hasDatabase = !!process.env.DATABASE_URL;

describe.skipIf(!hasDatabase)('API integration', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let token: string;
  const username = `testuser_${Date.now()}`;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const signup = await app.inject({
      method: 'POST',
      url: '/api/auth/signup',
      payload: { username, password: 'password123' },
    });
    expect(signup.statusCode).toBe(201);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: 'password123' },
    });
    expect(login.statusCode).toBe(200);
    token = login.json().token;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /api/auth/me returns current user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().username).toBe(username);
  });

  it('GET /api/links requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/links' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /:shortCode returns 404 for unknown code', async () => {
    const res = await app.inject({ method: 'GET', url: '/zzzzzz' });
    expect(res.statusCode).toBe(404);
    expect(res.body).toContain('404');
  });

  it('DELETE /api/auth/account removes user', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/auth/account',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });
});
