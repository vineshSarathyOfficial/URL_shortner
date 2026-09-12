import { scheduleHealthCheck, startHealthCheckWorker } from './queue.js';

async function main() {
  await scheduleHealthCheck();
  const worker = startHealthCheckWorker();
  console.log('Health check worker started');

  process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
