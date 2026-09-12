import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { ZodError } from 'zod';
import { config } from './config.js';
import { AppError } from './errors.js';
import { authRoutes } from './routes/auth.js';
import { linksRoutes } from './routes/links.js';
import { analyticsRoutes } from './routes/analytics.js';
import { redirectRoutes } from './routes/redirect.js';
import { publicDir } from './routes/spa.js';
import { scheduleHealthCheck } from './jobs/queue.js';

const app = Fastify({ logger: true });
const hasFrontend = existsSync(publicDir);

await app.register(cors, {
  origin: hasFrontend ? true : config.corsOrigins,
  credentials: true,
});

await app.register(rateLimit, {
  global: false,
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(error.toJSON());
  }
  if (error instanceof ZodError) {
    return reply.status(422).send({
      error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message || 'Validation failed' },
    });
  }
  app.log.error(error);
  return reply.status(500).send({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
});

app.get('/api/health', async () => ({ status: 'ok' }));

await app.register(authRoutes);
await app.register(linksRoutes);
await app.register(analyticsRoutes);

if (hasFrontend) {
  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/',
  });
}

await app.register(redirectRoutes);

if (hasFrontend) {
  app.setNotFoundHandler(async (request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api')) {
      return reply.sendFile('index.html');
    }
    return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
}

try {
  await scheduleHealthCheck();
} catch (err) {
  app.log.warn('Could not schedule health check (Redis may be unavailable): %s', err);
}

const start = async () => {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(hasFrontend ? 'Serving API + frontend from public/' : 'API only (no frontend build)');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
