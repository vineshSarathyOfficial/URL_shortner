import { FastifyInstance } from 'fastify';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const publicDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'public');
const indexPath = join(publicDir, 'index.html');

export async function spaRoutes(app: FastifyInstance) {
  if (!existsSync(indexPath)) {
    app.log.info('No frontend build found at public/ — SPA routes disabled');
    return;
  }

  app.get('/*', async (request, reply) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return reply.status(405).send({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    }
    return reply.sendFile('index.html');
  });
}

export { publicDir };
