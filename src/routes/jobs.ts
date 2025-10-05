import express, { Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { idempotency } from '../middleware/idempotency';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import pool from '../database/pool';
import { config } from '../config';
import { generateEmbedding, cosineSimilarity } from '../utils/embeddings';

const router = express.Router();

// POST /api/jobs - Create job
router.post(
  '/',
  authenticate,
  rateLimit,
  idempotency,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, required_skills, experience_required, location } = req.body;
    
    if (!title) {
      throw new AppError('FIELD_REQUIRED', 'Title is required', 400, 'title');
    }
    
    // Generate embedding for job description
    const jobText = `${title} ${description || ''} ${required_skills?.join(' ') || ''}`;
    const embedding = await generateEmbedding(jobText);
    
    const result = await pool.query(
      `INSERT INTO jobs (title, description, required_skills, experience_required, location, embedding, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, created_at`,
      [
        title,
        description || '',
        JSON.stringify(required_skills || []),
        experience_required || 0,
        location || '',
        JSON.stringify(embedding),
        req.user!.id,
      ]
    );
    
    const job = result.rows[0];
    
    res.status(201).json({
      id: job.id,
      title: job.title,
      created_at: job.created_at,
    });
  })
);

// GET /api/jobs - List jobs with pagination
router.get(
  '/',
  authenticate,
  rateLimit,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = Math.min(
      parseInt((req as any).query.limit as string) || config.defaultPaginationLimit,
      config.maxPaginationLimit
    );
    const offset = parseInt((req as any).query.offset as string) || 0;
    
    const result = await pool.query(
      `SELECT id, title, description, required_skills, experience_required, location, created_at
       FROM jobs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit + 1, offset]
    );
    
    const hasMore = result.rows.length > limit;
    const items = result.rows.slice(0, limit).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      required_skills: row.required_skills,
      experience_required: row.experience_required,
      location: row.location,
      created_at: row.created_at,
    }));
    
    res.json({
      items,
      next_offset: hasMore ? offset + limit : null,
    });
  })
);

// GET /api/jobs/:id - Get job details
router.get(
  '/:id',
  authenticate,
  rateLimit,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = (req as any).params;
    
    const result = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('NOT_FOUND', 'Job not found', 404);
    }
    
    const job = result.rows[0];
    
    res.json({
      id: job.id,
      title: job.title,
      description: job.description,
      required_skills: job.required_skills,
      experience_required: job.experience_required,
      location: job.location,
      created_at: job.created_at,
    });
  })
);

// POST /api/jobs/:id/match - Match candidates to job
router.post(
  '/:id/match',
  authenticate,
  rateLimit,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = (req as any).params;
    const { top_n = 10 } = req.body;
    
    // Get job details
    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );
    
    if (jobResult.rows.length === 0) {
      throw new AppError('NOT_FOUND', 'Job not found', 404);
    }
    
    const job = jobResult.rows[0];
    const jobEmbedding = JSON.parse(job.embedding);
    const requiredSkills = job.required_skills || [];
    const requiredExperience = job.experience_required || 0;
    
    // Get all resumes
    const resumesResult = await pool.query(
      'SELECT * FROM resumes WHERE embedding IS NOT NULL'
    );
    
    // Calculate match scores
    const matches = resumesResult.rows.map((resume: any) => {
      const parsedData = resume.parsed_data;
      const resumeEmbedding = JSON.parse(resume.embedding);
      const candidateSkills = parsedData.skills || [];
      const candidateExperience = parsedData.experience_years || 0;
      
      // Calculate skill match ratio
      const matchingSkills = requiredSkills.filter((skill: string) =>
        candidateSkills.some((cs: string) => cs.toLowerCase().includes(skill.toLowerCase()))
      );
      const skillMatchRatio = requiredSkills.length > 0
        ? matchingSkills.length / requiredSkills.length
        : 0;
      
      // Calculate experience match score
      const experienceMatchScore = requiredExperience > 0
        ? Math.min(candidateExperience / requiredExperience, 1.0)
        : 1.0;
      
      // Calculate semantic similarity
      const semanticSimilarity = cosineSimilarity(jobEmbedding, resumeEmbedding);
      
      // Calculate overall match score (deterministic)
      const matchScore = (
        skillMatchRatio * 0.5 +
        experienceMatchScore * 0.3 +
        semanticSimilarity * 0.2
      ) * 100;
      
      // Missing skills
      const missingSkills = requiredSkills.filter((skill: string) =>
        !candidateSkills.some((cs: string) => cs.toLowerCase().includes(skill.toLowerCase()))
      );
      
      // Generate evidence
      const evidence = generateEvidence(
        parsedData,
        matchingSkills,
        candidateExperience,
        requiredExperience
      );
      
      return {
        resume_id: resume.id,
        candidate_name: parsedData.name,
        match_score: parseFloat(matchScore.toFixed(2)),
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        evidence,
        experience_match: candidateExperience >= requiredExperience,
      };
    });
    
    // Sort by match score (deterministic)
    matches.sort((a, b) => b.match_score - a.match_score);
    
    // Take top N
    const topMatches = matches.slice(0, Math.min(top_n, 50));
    
    res.json({
      job_id: id,
      matches: topMatches,
      ranked_by: 'deterministic_score',
    });
  })
);

function generateEvidence(
  parsedData: any,
  matchingSkills: string[],
  candidateExperience: number,
  requiredExperience: number
): string {
  const parts = [];
  
  if (matchingSkills.length > 0) {
    parts.push(`Has ${matchingSkills.length} matching skill(s): ${matchingSkills.slice(0, 3).join(', ')}`);
  }
  
  if (candidateExperience > 0) {
    parts.push(`${candidateExperience} years of experience`);
    
    if (candidateExperience >= requiredExperience) {
      parts.push(`(meets ${requiredExperience} year requirement)`);
    }
  }
  
  if (parsedData.summary && parsedData.summary.length > 0) {
    const summarySnippet = parsedData.summary.substring(0, 100);
    parts.push(`Profile: ${summarySnippet}...`);
  }
  
  return parts.join('. ');
}

export default router;
