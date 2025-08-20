import { Worker } from 'bullmq';
import redis from '../../database/redis';
import { paymentRepository } from '../../repositories/PaymentsRepository';

const paymentJob = async (job: any) => {
  const { correlationId, amount } = job.data;
  console.log(`Processing new job: ${correlationId}`);

  const processors: ('default' | 'fallback')[] = ['default', 'fallback'];

  while (true) {
    let processed = false;
    const processedAt = new Date();
    for (const processor of processors) {
      try {
        await paymentRepository.sendToProcessor(
          processor,
          correlationId,
          amount,
          processedAt,
        );

        await redis.set(
          `payment:${correlationId}`,
          `PROCESSED:${processor}`,
          'EX',
          3600,
        );

        await paymentRepository.create(
          correlationId,
          amount,
          processor,
          processedAt,
        );
        processed = true;
        console.log(`Job ${correlationId} processed by ${processor}`);
        return;
      } catch (error) {
        console.warn(
          `Processor ${processor} failed for ${correlationId}, retrying next...`,
        );
      }
    }

    if (!processed) {
      console.warn(
        `All processors failed for ${correlationId}, retrying in 5s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

const paymentWorker = new Worker('payment-queue', paymentJob, {
  connection: redis,
});

paymentWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed`);
});

paymentWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});

console.log('Worker running');
