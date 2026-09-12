import { Link, LinkStatus } from '@prisma/client';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { AppError } from '../errors.js';
import { getEffectiveStatus } from './linkLifecycle.js';
import { generateUniqueShortCode } from './shortCodeGenerator.js';
import { checkReachability } from './urlValidator.js';

export function buildShortUrl(shortCode: string): string {
  return `${config.appBaseUrl.replace(/\/$/, '')}/${shortCode}`;
}

export function linkToResponse(link: Link) {
  return {
    id: link.id,
    original_url: link.originalUrl,
    short_code: link.shortCode,
    short_url: buildShortUrl(link.shortCode),
    click_count: link.clickCount,
    status: link.status,
    effective_status: getEffectiveStatus(link),
    created_at: link.createdAt.toISOString(),
    last_activated_at: link.lastActivatedAt?.toISOString() ?? null,
    reactivated_at: link.reactivatedAt?.toISOString() ?? null,
    last_health_checked_at: link.lastHealthCheckedAt?.toISOString() ?? null,
  };
}

export async function createLink(userId: string, originalUrl: string) {
  await checkReachability(originalUrl);
  const shortCode = await generateUniqueShortCode();

  return prisma.link.create({
    data: {
      userId,
      originalUrl: originalUrl.trim(),
      shortCode,
      status: LinkStatus.ACTIVE,
      clickCount: 0,
    },
  });
}

export async function listUserLinks(userId: string) {
  return prisma.link.findMany({
    where: { userId, status: { not: LinkStatus.DELETED } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOwnedLink(userId: string, linkId: string) {
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId, status: { not: LinkStatus.DELETED } },
  });
  if (!link) throw new AppError('LINK_NOT_FOUND', 'Link not found', 404);
  return link;
}

export async function softDeleteLink(userId: string, linkId: string) {
  const link = await getOwnedLink(userId, linkId);
  await prisma.link.update({
    where: { id: link.id },
    data: { status: LinkStatus.DELETED, deletedAt: new Date() },
  });
}

export async function reactivateLink(userId: string, linkId: string) {
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId, status: { not: LinkStatus.DELETED } },
  });
  if (!link) throw new AppError('LINK_NOT_FOUND', 'Link not found', 404);

  const now = new Date();
  return prisma.link.update({
    where: { id: link.id },
    data: {
      status: LinkStatus.ACTIVE,
      lastActivatedAt: now,
      reactivatedAt: now,
    },
  });
}

export async function getLinkByShortCode(shortCode: string) {
  return prisma.link.findUnique({ where: { shortCode: shortCode.toLowerCase() } });
}

export async function recordAccess(link: Link): Promise<string> {
  const now = new Date();

  await prisma.$transaction([
    prisma.linkAccessEvent.create({ data: { linkId: link.id, accessedAt: now } }),
    prisma.link.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 }, lastActivatedAt: now },
    }),
  ]);

  return link.originalUrl;
}
