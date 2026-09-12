import { prisma } from '../db.js';
import { getOwnedLink } from './linkService.js';

export async function getLinkAnalytics(userId: string, linkId: string, period: string = 'day') {
  const link = await getOwnedLink(userId, linkId);
  const now = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.linkAccessEvent.findMany({
    where: { linkId: link.id, accessedAt: { gte: start } },
    orderBy: { accessedAt: 'asc' },
  });

  const dayMap = new Map<string, number>();
  for (const event of events) {
    const day = event.accessedAt.toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  const clicksByDay = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const recentEvents = await prisma.linkAccessEvent.findMany({
    where: { linkId: link.id },
    orderBy: { accessedAt: 'desc' },
    take: 50,
  });

  return {
    total_clicks: link.clickCount,
    clicks_by_day: clicksByDay,
    recent_accesses: recentEvents.map((e) => ({ accessed_at: e.accessedAt.toISOString() })),
  };
}
