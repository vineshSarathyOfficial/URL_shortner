import { Link, LinkStatus } from '@prisma/client';
import { config } from '../config.js';

export function getEffectiveStatus(link: Link, now = new Date()): LinkStatus {
  if (link.status === LinkStatus.DELETED) return LinkStatus.DELETED;
  if (link.status === LinkStatus.INACTIVE) return LinkStatus.INACTIVE;

  const reference = link.lastActivatedAt ?? link.createdAt;
  const diffMs = now.getTime() - reference.getTime();
  const inactivityMs = config.inactivityDays * 24 * 60 * 60 * 1000;

  if (diffMs >= inactivityMs) return LinkStatus.INACTIVE;
  return LinkStatus.ACTIVE;
}

export function isShortCodeValidFormat(shortCode: string): boolean {
  return shortCode.length === config.shortCodeLength && /^[a-zA-Z0-9]+$/.test(shortCode);
}
