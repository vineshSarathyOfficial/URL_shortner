import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import {
  createLink,
  getOwnedLink,
  linkToResponse,
  listUserLinks,
  reactivateLink,
  softDeleteLink,
} from '../services/linkService.js';
import { AppError } from '../errors.js';

const createLinkSchema = z.object({
  original_url: z.string().max(2048),
});

export async function linksRoutes(app: FastifyInstance) {
  app.post('/api/links', {
    preHandler: authMiddleware,
    config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const body = createLinkSchema.parse(request.body);
    try {
      const link = await createLink(userId, body.original_url);
      return reply.status(201).send(linkToResponse(link));
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send(err.toJSON());
      throw err;
    }
  });

  app.get('/api/links', { preHandler: authMiddleware }, async (request) => {
    const { userId } = request as AuthenticatedRequest;
    const links = await listUserLinks(userId);
    return { links: links.map(linkToResponse), total: links.length };
  });

  app.get('/api/links/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    try {
      const link = await getOwnedLink(userId, id);
      return linkToResponse(link);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send(err.toJSON());
      throw err;
    }
  });

  app.delete('/api/links/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    try {
      await softDeleteLink(userId, id);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send(err.toJSON());
      throw err;
    }
  });

  app.post('/api/links/:id/reactivate', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    try {
      const link = await reactivateLink(userId, id);
      return linkToResponse(link);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send(err.toJSON());
      throw err;
    }
  });
}
