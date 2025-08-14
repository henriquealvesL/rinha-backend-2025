import { FastifyInstance } from 'fastify';
import paymentQueue from '../queues/paymentQueue';
import redis from '../database/redis';

interface IPaymentRequest {
  Body: {
    correlationId: string;
    amount: number;
  };
}

export async function paymentRoutes(app: FastifyInstance) {
  app.post<IPaymentRequest>('/payments', async (request, reply) => {
    const { correlationId, amount } = request.body;

    const alreadyExists = await redis.exists(`payment:${correlationId}`);

    if (alreadyExists) {
      return reply.code(409).send({ message: 'Payment already exists' });
    }

    await redis.set(`payment:${correlationId}`, 'PENDING', 'EX', 300);

    await paymentQueue.add('new-payment', { correlationId, amount });

    return reply.code(202).send({ message: 'Payment received' });
  });
}
