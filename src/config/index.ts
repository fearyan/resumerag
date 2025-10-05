import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resumerag',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimitPerMinute: 60,
  maxPaginationLimit: 100,
  defaultPaginationLimit: 20,
};
