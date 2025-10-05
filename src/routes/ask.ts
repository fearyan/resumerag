import express, { Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import pool from '../database/pool';
import { generateEmbedding, cosineSimilarity } from '../utils/embeddings';

const router = express.Router();

// POST /api/ask - Semantic search
router.post(
  '/',
  authenticate,
  rateLimit,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { query, k = 5 } = req.body;
    
    if (!query) {
      throw new AppError('FIELD_REQUIRED', 'Query is required', 400, 'query');
    }
    
    const topK = Math.min(parseInt(k), 20); // Max 20 results
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search using cosine similarity
    const result = await pool.query(
      `SELECT 
        r.id,
        r.filename,
        r.raw_text,
        r.parsed_data,
        r.embedding,
        1 - (r.embedding <=> $1::vector) as similarity
       FROM resumes r
       WHERE r.embedding IS NOT NULL
       ORDER BY r.embedding <=> $1::vector
       LIMIT $2`,
      [JSON.stringify(queryEmbedding), topK]
    );
    
    const answers = result.rows.map((row: any) => {
      const parsedData = row.parsed_data;
      const snippet = extractSnippet(row.raw_text, query);
      
      return {
        resume_id: row.id,
        candidate_name: parsedData.name,
        snippet,
        relevance_score: parseFloat(row.similarity.toFixed(2)),
        metadata: {
          filename: row.filename,
          section: 'experience', // Could be enhanced to detect section
        },
      };
    });
    
    res.json({
      query,
      answers,
    });
  })
);

function extractSnippet(text: string, query: string, contextLength: number = 150): string {
  // Find query terms in text
  const queryTerms = query.toLowerCase().split(/\s+/);
  const lowerText = text.toLowerCase();
  
  let bestPosition = 0;
  let maxMatches = 0;
  
  // Find position with most query term matches
  for (let i = 0; i < text.length - contextLength; i += 50) {
    const window = lowerText.substring(i, i + contextLength);
    const matches = queryTerms.filter(term => window.includes(term)).length;
    
    if (matches > maxMatches) {
      maxMatches = matches;
      bestPosition = i;
    }
  }
  
  // Extract snippet around best position
  const start = Math.max(0, bestPosition);
  const end = Math.min(text.length, start + contextLength);
  let snippet = text.substring(start, end).trim();
  
  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

export default router;
