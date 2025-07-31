// src/routes/index.ts
import { FastifyInstance } from 'fastify';
import { paymentRoutes } from './paymentRoutes';

export async function Routes(app: FastifyInstance) {
  app.register(paymentRoutes);
}
