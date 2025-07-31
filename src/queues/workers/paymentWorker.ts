import { Worker } from 'bullmq';
import redis from '../../database/redis';
import { paymentRepository } from '../../repositories/PaymentsRepository';

const paymentJob = async (job: any) => {
  const { correlationId, amount } = job.data;
  console.log(`Processing new job: ${correlationId}`);

  try {
    const amountInCents = Math.round(amount * 100);

    await paymentRepository.create(correlationId, amountInCents);
  } catch (error) {
    console.log('Failed to process job');
    throw error;
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
