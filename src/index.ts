import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import metaRouter from './routes/meta';
import authRouter from './routes/auth';
import resumesRouter from './routes/resumes';
import askRouter from './routes/ask';
import jobsRouter from './routes/jobs';

const app = express();

// CORS configuration - allow all origins for judging
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', metaRouter);
app.use('/api/auth', authRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/ask', askRouter);
app.use('/api/jobs', jobsRouter);

// Hackathon manifest endpoint
app.get('/.well-known/hackathon.json', (req: Request, res: Response) => {
  res.json({
    team_name: 'ResumeRAG Team',
    problem_statement: 'ResumeRAG',
    api_base_url: `http://localhost:${config.port}/api`,
    demo_credentials: {
      email: 'admin@mail.com',
      password: 'admin123',
    },
    endpoints: {
      health: '/api/health',
      meta: '/api/_meta',
      resumes: '/api/resumes',
      ask: '/api/ask',
      jobs: '/api/jobs',
      match: '/api/jobs/:id/match',
    },
    features: {
      pagination: true,
      idempotency: true,
      rate_limiting: true,
      cors: true,
      authentication: 'JWT',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════╗
║     ResumeRAG API Server              ║
╚═══════════════════════════════════════╝

🚀 Server running on http://localhost:${config.port}
📊 Health check: http://localhost:${config.port}/api/health
📖 API docs: http://localhost:${config.port}/api/_meta
🏆 Manifest: http://localhost:${config.port}/.well-known/hackathon.json

Environment: ${config.nodeEnv}
Database: ${config.databaseUrl.split('@')[1] || 'configured'}
Embedding: ${config.openaiApiKey ? 'OpenAI' : 'Not configured'}
  `);
});

export default app;
