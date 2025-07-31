import { Queue } from 'bullmq';
import redis from '../database/redis';

const paymentQueue = new Queue('payment-queue', {
  connection: redis,
});

export default paymentQueue;
