import { FastifyRequest, FastifyReply } from 'fastify';
import { decodeAccessToken, getUserById } from '../services/authService.js';
import { AppError } from '../errors.js';

export interface AuthenticatedRequest extends FastifyRequest {
  userId: string;
  username: string;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
  }

  try {
    const payload = decodeAccessToken(header.slice(7));
    const user = await getUserById(payload.sub);
    if (!user) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }
    (request as AuthenticatedRequest).userId = user.id;
    (request as AuthenticatedRequest).username = user.username;
  } catch (err) {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send(err.toJSON());
    }
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}
