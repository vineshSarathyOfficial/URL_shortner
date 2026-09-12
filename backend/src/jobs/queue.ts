import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { runDailyHealthCheck } from './healthCheck.js';

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

export const healthCheckQueue = new Queue('health-check', { connection });

export async function scheduleHealthCheck() {
  await healthCheckQueue.add(
    'daily-health-check',
    {},
    {
      repeat: { pattern: '0 2 * * *' },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
}

export function startHealthCheckWorker() {
  const worker = new Worker(
    'health-check',
    async () => {
      await runDailyHealthCheck();
    },
    { connection, concurrency: 1 }
  );

  worker.on('failed', (job, err) => {
    console.error(`Health check job ${job?.id} failed:`, err);
  });

  return worker;
}
