import { pool } from '../database/postgres';
import { DatabaseError } from 'pg';

class PaymentRepository {
  async create(correlationId: string, amount: number) {
    try {
      await pool.query(
        'INSERT INTO payments (correlation_id, amount) VALUES ($1, $2)',
        [correlationId, amount],
      );

      return { success: true, isDuplicate: false };
    } catch (error: unknown) {
      if (error instanceof DatabaseError) {
        if (error.code === '23505') {
          console.log('Payment already exists');
          return { sucess: false, isDuplicate: true };
        }

        console.log(`Error inserting on database: ${error.message}`);
        return { success: false, isDuplicate: false };
      }

      console.error('Unexpected database error');
      throw error;
    }
  }
}

export const paymentRepository = new PaymentRepository();
