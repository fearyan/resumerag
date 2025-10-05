import express, { Request, Response } from 'express';
import pool from '../database/pool';
import { config } from '../config';

const router = express.Router();

// GET /api/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    const databaseStatus = 'connected';
    
    // Check embedding service (OpenAI API key present)
    const embeddingStatus = config.openaiApiKey ? 'ready' : 'not_configured';
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      embedding_service: embeddingStatus,
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      embedding_service: 'unknown',
    });
  }
});

// GET /api/_meta
router.get('/_meta', (req: Request, res: Response) => {
  res.json({
    version: '1.0.0',
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/resumes',
      '/api/resumes/:id',
      '/api/ask',
      '/api/jobs',
      '/api/jobs/:id',
      '/api/jobs/:id/match',
    ],
    features: ['pagination', 'idempotency', 'rate_limiting', 'pii_redaction'],
    limits: {
      rate_limit: '60 req/min/user',
      max_file_size: '10MB',
      max_pagination_limit: 100,
    },
  });
});

export default router;
