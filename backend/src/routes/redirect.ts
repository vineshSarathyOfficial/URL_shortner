import { FastifyInstance } from 'fastify';
import { LinkStatus } from '@prisma/client';
import { getEffectiveStatus, isShortCodeValidFormat } from '../services/linkLifecycle.js';
import { getLinkByShortCode, recordAccess } from '../services/linkService.js';

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link Not Found</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 6rem; font-weight: 700; opacity: 0.9; }
    h2 { font-size: 1.5rem; margin: 1rem 0; font-weight: 400; }
    p { opacity: 0.8; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <h2>This link is unavailable</h2>
    <p>The short link you're looking for doesn't exist or is no longer active.</p>
  </div>
</body>
</html>`;

export async function redirectRoutes(app: FastifyInstance) {
  app.get('/:shortCode', {
    config: { rateLimit: { max: 100, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };

    if (!isShortCodeValidFormat(shortCode)) {
      return reply.callNotFound();
    }

    const link = await getLinkByShortCode(shortCode);
    if (!link) {
      return reply.status(404).type('text/html').send(NOT_FOUND_HTML);
    }

    const effectiveStatus = getEffectiveStatus(link);
    if (effectiveStatus === LinkStatus.INACTIVE || effectiveStatus === LinkStatus.DELETED) {
      return reply.status(404).type('text/html').send(NOT_FOUND_HTML);
    }

    const originalUrl = await recordAccess(link);
    return reply.redirect(originalUrl, 302);
  });
}
