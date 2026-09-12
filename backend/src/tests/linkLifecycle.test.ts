import { describe, it, expect } from 'vitest';
import { LinkStatus } from '@prisma/client';
import { getEffectiveStatus, isShortCodeValidFormat } from '../services/linkLifecycle.js';

describe('linkLifecycle', () => {
  const baseLink = {
    id: '1',
    userId: '1',
    originalUrl: 'https://example.com',
    shortCode: 'abc123',
    clickCount: 0,
    status: LinkStatus.ACTIVE,
    createdAt: new Date(),
    lastActivatedAt: null,
    deletedAt: null,
    reactivatedAt: null,
    lastHealthCheckedAt: null,
  };

  it('validates short code format', () => {
    expect(isShortCodeValidFormat('abc123')).toBe(true);
    expect(isShortCodeValidFormat('ABC123')).toBe(true);
    expect(isShortCodeValidFormat('abc12')).toBe(false);
    expect(isShortCodeValidFormat('abc-12')).toBe(false);
  });

  it('returns ACTIVE within 30 days', () => {
    const link = {
      ...baseLink,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    };
    expect(getEffectiveStatus(link)).toBe(LinkStatus.ACTIVE);
  });

  it('returns INACTIVE after 30 days with no access', () => {
    const link = {
      ...baseLink,
      createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    };
    expect(getEffectiveStatus(link)).toBe(LinkStatus.INACTIVE);
  });

  it('returns DELETED for deleted links', () => {
    const link = { ...baseLink, status: LinkStatus.DELETED };
    expect(getEffectiveStatus(link)).toBe(LinkStatus.DELETED);
  });
});
