import { FastifyInstance } from 'fastify';
import paymentQueue from '../queues/paymentQueue';
import redis from '../database/redis';
import { paymentRepository } from '../repositories/PaymentsRepository';

interface IPaymentRequest {
  Body: {
    correlationId: string;
    amount: number;
  };
}

type Query = { from?: string; to?: string };

function parseIso(q?: string): Date | undefined {
  if (!q) return undefined;
  const d = new Date(q);
  return isNaN(d.getTime()) ? undefined : d;
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

  app.get<{ Querystring: Query }>(
    '/payments-summary',
    async (request, reply) => {
      const { from: fromStr, to: toStr } = request.query;

      const from = parseIso(fromStr);
      const to = parseIso(toStr);

      if (fromStr && !from) {
        return reply
          .code(400)
          .send({ message: "Invalid 'from' timestamp (expected ISO UTC)" });
      }
      if (toStr && !to) {
        return reply
          .code(400)
          .send({ message: "Invalid 'to' timestamp (expected ISO UTC)" });
      }
      if (from && to && from > to) {
        return reply.code(400).send({ message: "'from' must be <= 'to'" });
      }

      const summary = await paymentRepository.getSummary(from, to);

      return reply.code(200).send(summary);
    },
  );
}
