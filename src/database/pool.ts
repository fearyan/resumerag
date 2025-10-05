import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

export default pool;
