import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthRequest, authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { idempotency } from '../middleware/idempotency';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import pool from '../database/pool';
import { config } from '../config';
import { extractTextFromFile, parseResume, extractFilesFromZip } from '../utils/fileProcessing';
import { generateEmbedding } from '../utils/embeddings';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.txt', '.zip'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, TXT, and ZIP are allowed.'));
    }
  },
});

// POST /api/resumes - Upload resume(s)
router.post(
  '/',
  authenticate,
  rateLimit,
  idempotency,
  upload.array('files', 10),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new AppError('FIELD_REQUIRED', 'No files uploaded', 400, 'files');
    }
    
    const results = [];
    
    for (const file of files) {
      try {
        // Handle ZIP files
        if (path.extname(file.originalname).toLowerCase() === '.zip') {
          const extractedFiles = await extractFilesFromZip(file.buffer);
          
          for (const extracted of extractedFiles) {
            const result = await processResumeFile(
              extracted.buffer,
              extracted.filename,
              req.user!.id
            );
            results.push(result);
          }
        } else {
          const result = await processResumeFile(file.buffer, file.originalname, req.user!.id);
          results.push(result);
        }
      } catch (error: any) {
        results.push({
          filename: file.originalname,
          status: 'failed',
          error: error.message,
        });
      }
    }
    
    res.status(201).json({ resumes: results });
  })
);

async function processResumeFile(
  buffer: Buffer,
  filename: string,
  userId: string
): Promise<any> {
  try {
    // Extract text
    const rawText = await extractTextFromFile(buffer, filename);
    
    // Parse resume
    const parsedData = parseResume(rawText);
    
    // Generate embedding
    const embedding = await generateEmbedding(rawText);
    
    // Store in database
    const result = await pool.query(
      `INSERT INTO resumes (filename, raw_text, parsed_data, embedding, uploaded_by, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, filename, processing_status, uploaded_at`,
      [filename, rawText, JSON.stringify(parsedData), JSON.stringify(embedding), userId, 'completed']
    );
    
    const resume = result.rows[0];
    
    return {
      id: resume.id,
      filename: resume.filename,
      status: resume.processing_status,
      uploaded_at: resume.uploaded_at,
    };
  } catch (error: any) {
    throw new Error(`Failed to process ${filename}: ${error.message}`);
  }
}

// GET /api/resumes - List resumes with pagination
router.get(
  '/',
  authenticate,
  rateLimit,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = Math.min(
      parseInt(req.query.limit as string) || config.defaultPaginationLimit,
      config.maxPaginationLimit
    );
    const offset = parseInt(req.query.offset as string) || 0;
    const searchQuery = req.query.q as string;
    
    let query = `
      SELECT r.id, r.filename, r.parsed_data, r.uploaded_at
      FROM resumes r
    `;
    
    const params: any[] = [];
    
    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      query += ` WHERE r.raw_text ILIKE $${params.length}`;
    }
    
    query += ` ORDER BY r.uploaded_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit + 1, offset);
    
    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limit;
    const items = result.rows.slice(0, limit);
    
    const formattedItems = items.map((row: any) => {
      const parsedData = row.parsed_data;
      const isRecruiterOrAdmin = req.user!.role === 'recruiter' || req.user!.role === 'admin';
      
      return {
        id: row.id,
        filename: row.filename,
        candidate_name: parsedData.name,
        email: isRecruiterOrAdmin ? parsedData.email : null,
        phone: isRecruiterOrAdmin ? parsedData.phone : null,
        skills: parsedData.skills,
        experience_years: parsedData.experience_years,
        uploaded_at: row.uploaded_at,
      };
    });
    
    res.json({
      items: formattedItems,
      next_offset: hasMore ? offset + limit : null,
    });
  })
);

// GET /api/resumes/:id - Get resume details
router.get(
  '/:id',
  authenticate,
  rateLimit,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, filename, raw_text, parsed_data, uploaded_at FROM resumes WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('NOT_FOUND', 'Resume not found', 404);
    }
    
    const resume = result.rows[0];
    const parsedData = resume.parsed_data;
    const isRecruiterOrAdmin = req.user!.role === 'recruiter' || req.user!.role === 'admin';
    
    // Redact PII if not recruiter/admin
    if (!isRecruiterOrAdmin) {
      parsedData.email = '***REDACTED***';
      parsedData.phone = '***REDACTED***';
    }
    
    res.json({
      id: resume.id,
      filename: resume.filename,
      raw_text: resume.raw_text,
      parsed_data: parsedData,
      uploaded_at: resume.uploaded_at,
    });
  })
);

export default router;
