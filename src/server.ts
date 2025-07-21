import 'dotenv/config';
import { buildApp } from './app';

const app = buildApp();

const start = async () => {
  try {
    console.log('API running on port 9999');
    await app.listen({ port: 9999, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
