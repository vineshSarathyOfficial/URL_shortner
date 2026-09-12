import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { AppError } from '../errors.js';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function createAccessToken(userId: string, username: string): string {
  return jwt.sign({ sub: userId, username }, config.jwtSecret, { expiresIn: '1h' });
}

export function decodeAccessToken(token: string): { sub: string; username: string } {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; username: string };
    return payload;
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
  }
}

export async function createUser(username: string, password: string) {
  const existing = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });
  if (existing) {
    throw new AppError('USERNAME_EXISTS', 'Username already exists', 409);
  }

  return prisma.user.create({
    data: { username, passwordHash: await hashPassword(password) },
  });
}

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password', 401);
  }
  return user;
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function deleteAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
