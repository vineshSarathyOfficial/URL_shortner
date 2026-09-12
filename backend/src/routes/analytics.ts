import { FastifyInstance } from 'fastify';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getLinkAnalytics } from '../services/analyticsService.js';
import { AppError } from '../errors.js';

export async function analyticsRoutes(app: FastifyInstance) {
  app.get('/api/links/:id/analytics', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const { period = 'day' } = request.query as { period?: string };

    if (!['day', 'week', 'month'].includes(period)) {
      return reply.status(422).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid period. Use day, week, or month.' },
      });
    }

    try {
      return await getLinkAnalytics(userId, id, period);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send(err.toJSON());
      throw err;
    }
  });
}
