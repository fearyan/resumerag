import OpenAI from 'openai';
import { config } from '../config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Truncate text to avoid token limits (approx 8000 tokens = 32000 chars)
    const truncatedText = text.substring(0, 32000);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedText,
      encoding_format: 'float',
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Embedding generation error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const truncatedTexts = texts.map(text => text.substring(0, 32000));
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedTexts,
      encoding_format: 'float',
    });
    
    return response.data.map(item => item.embedding);
  } catch (error: any) {
    console.error('Batch embedding generation error:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
