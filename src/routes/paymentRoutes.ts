import { FastifyInstance } from 'fastify';
import paymentQueue from '../queues/paymentQueue';

interface IPaymentRequest {
  Body: {
    correlationId: string;
    amount: number;
  };
}

export async function paymentRoutes(app: FastifyInstance) {
  app.post<IPaymentRequest>('/payments', async (request, reply) => {
    const { correlationId, amount } = request.body;

    await paymentQueue.add('new-payment', { correlationId, amount });

    return reply.code(202);
  });
}
