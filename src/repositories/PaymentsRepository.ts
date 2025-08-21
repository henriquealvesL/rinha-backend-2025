import axios from 'axios';
import { pool } from '../database/postgres';
import { DatabaseError } from 'pg';

export type Summary = {
  default: { totalRequests: number; totalAmount: number };
  fallback: { totalRequests: number; totalAmount: number };
};

type Processor = 'default' | 'fallback';

const PAYMENT_PROCESSORS = {
  default: {
    url: 'http://payment-processor-default:8080/payments',
    fee: 0.05, // 5%
  },
  fallback: {
    url: 'http://payment-processor-fallback:8080/payments',
    fee: 0.15, // 15%
  },
};

class PaymentRepository {
  async create(
    correlationId: string,
    amount: number,
    processor: 'default' | 'fallback',
    processedAt: Date,
  ) {
    const processedAmount = Math.round(
      amount * (1 - PAYMENT_PROCESSORS[processor].fee) * 100,
    );

    try {
      await pool.query(
        `INSERT INTO payments (correlation_id, amount, processor, status, processed_at) VALUES ($1, $2, $3,'processed', NOW())
        ON CONFLICT (correlation_id) DO UPDATE
          SET status = 'processed', processor=EXCLUDED.processor, amount=EXCLUDED.amount, processed_at=$4
        `,
        [correlationId, processedAmount, processor, processedAt],
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

  async getSummary(from?: Date, to?: Date): Promise<Summary> {
    const params: (Date | null)[] = [from ?? null, to ?? null];

    const sql = `
      SELECT
        COALESCE(COUNT(*) FILTER (WHERE processor = 'default'), 0) AS default_requests,
        COALESCE(SUM(amount) FILTER (WHERE processor = 'default'), 0) AS default_amount,
        COALESCE(COUNT(*) FILTER (WHERE processor = 'fallback'), 0) AS fallback_requests,
        COALESCE(SUM(amount) FILTER (WHERE processor = 'fallback'), 0) AS fallback_amount
      FROM payments
      WHERE status = 'processed'
      AND ($1::timestamp IS NULL OR created_at >= $1::timestamp)
      AND ($2::timestamp IS NULL OR created_at <= $2::timestamp);

      `;

    const { rows } = await pool.query(sql, params);
    const r = rows[0];

    return {
      default: {
        totalRequests: r.default_requests,
        totalAmount: r.default_amount,
      },
      fallback: {
        totalRequests: r.fallback_requests,
        totalAmount: r.fallback_amount,
      },
    };
  }

  async sendToProcessor(
    processor: Processor,
    correlationId: string,
    amount: number,
    processedAt: Date,
  ) {
    const fee = PAYMENT_PROCESSORS[processor].fee;
    const amountAfterFee = Math.round(amount * (1 - fee) * 100) / 100;
    await axios.post(PAYMENT_PROCESSORS[processor].url, {
      correlationId,
      amount: amountAfterFee,
      requestedAt: processedAt,
    });
  }
}

export const paymentRepository = new PaymentRepository();
