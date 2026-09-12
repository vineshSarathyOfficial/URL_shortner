import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  authenticateUser,
  createAccessToken,
  createUser,
  deleteAccount,
  getUserById,
} from '../services/authService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../errors.js';

const signupSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/signup', {
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const body = signupSchema.parse(request.body);
    try {
      const user = await createUser(body.username, body.password);
      return reply.status(201).send({
        id: user.id,
        username: user.username,
        created_at: user.createdAt.toISOString(),
      });
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send(err.toJSON());
      throw err;
    }
  });

  app.post('/api/auth/login', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = loginSchema.parse(request.body);
    try {
      const user = await authenticateUser(body.username, body.password);
      const token = createAccessToken(user.id, user.username);
      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          created_at: user.createdAt.toISOString(),
        },
      };
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send(err.toJSON());
      throw err;
    }
  });

  app.post('/api/auth/logout', { preHandler: authMiddleware }, async (_request, reply) => {
    return reply.status(204).send();
  });

  app.get('/api/auth/me', { preHandler: authMiddleware }, async (request) => {
    const { userId } = request as AuthenticatedRequest;
    const user = await getUserById(userId);
    return {
      id: user!.id,
      username: user!.username,
      created_at: user!.createdAt.toISOString(),
    };
  });

  app.delete('/api/auth/account', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    await deleteAccount(userId);
    return reply.status(204).send();
  });
}
