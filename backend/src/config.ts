import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/urlshortener',
  redisUrl:
    process.env.REDIS_URL ||
    process.env.REDIS_PRIVATE_URL ||
    'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '1h',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:8000',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  urlMaxLength: 2048,
  shortCodeLength: 6,
  shortCodeCollisionRetries: 10,
  urlValidationTimeout: 10000,
  urlValidationRedirectLimit: 5,
  inactivityDays: 30,
  healthCheckBatchSize: 100,
};
