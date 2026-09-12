import crypto from 'node:crypto';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { AppError } from '../errors.js';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateShortCode(): string {
  let code = '';
  const bytes = crypto.randomBytes(config.shortCodeLength);
  for (let i = 0; i < config.shortCodeLength; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export async function generateUniqueShortCode(): Promise<string> {
  for (let i = 0; i < config.shortCodeCollisionRetries; i++) {
    const code = generateShortCode();
    const existing = await prisma.link.findUnique({ where: { shortCode: code } });
    if (!existing) return code;
  }
  throw new AppError('VALIDATION_ERROR', 'Unable to generate unique short code', 500);
}
