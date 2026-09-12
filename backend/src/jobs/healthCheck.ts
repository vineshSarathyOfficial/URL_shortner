import { LinkStatus } from '@prisma/client';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { checkReachability } from '../services/urlValidator.js';

export async function runDailyHealthCheck(): Promise<void> {
  const now = new Date();
  let offset = 0;

  while (true) {
    const links = await prisma.link.findMany({
      where: { status: LinkStatus.ACTIVE },
      orderBy: { id: 'asc' },
      skip: offset,
      take: config.healthCheckBatchSize,
    });

    if (links.length === 0) break;

    for (const link of links) {
      try {
        await checkReachability(link.originalUrl);
        await prisma.link.update({
          where: { id: link.id },
          data: { lastHealthCheckedAt: now },
        });
      } catch {
        await prisma.link.update({
          where: { id: link.id },
          data: { status: LinkStatus.INACTIVE, lastHealthCheckedAt: now },
        });
      }
    }

    offset += config.healthCheckBatchSize;
  }
}
