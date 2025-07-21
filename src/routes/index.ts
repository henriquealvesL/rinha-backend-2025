// src/routes/index.ts
import { FastifyInstance } from 'fastify';
import { pool } from '../database/postgres';

export async function Routes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const result = await pool.query('SELECT 1 + 1 as sum');
    return {
      message: 'Hello World from a structured app!',
      sum: result.rows[0].sum,
    };
  });
}
