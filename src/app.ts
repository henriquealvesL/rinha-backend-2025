import Fastify from 'fastify';
import { Routes } from './routes';

export function buildApp() {
  const fastify = Fastify({
    logger: true,
  });

  fastify.register(Routes);

  return fastify;
}
