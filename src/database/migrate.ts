import pool from './pool';

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Running database migrations...');
    
    // Enable pgvector extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log('✓ pgvector extension enabled');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'recruiter', 'admin')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Users table created');
    
    // Create resumes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        raw_text TEXT,
        parsed_data JSONB,
        embedding VECTOR(1536),
        uploaded_by UUID REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        processing_status VARCHAR(50) DEFAULT 'completed' 
          CHECK (processing_status IN ('processing', 'completed', 'failed'))
      );
    `);
    console.log('✓ Resumes table created');
    
    // Create index on embedding for fast similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS resumes_embedding_idx ON resumes 
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
    console.log('✓ Resume embedding index created');
    
    // Create jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        required_skills JSONB,
        experience_required INT,
        location VARCHAR(255),
        embedding VECTOR(1536),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Jobs table created');
    
    // Create index on job embedding
    await client.query(`
      CREATE INDEX IF NOT EXISTS jobs_embedding_idx ON jobs 
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
    console.log('✓ Job embedding index created');
    
    // Create idempotency_keys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key UUID PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        request_hash VARCHAR(255),
        response JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
      );
    `);
    console.log('✓ Idempotency keys table created');
    
    // Create index on expires_at for cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idempotency_keys_expires_idx ON idempotency_keys (expires_at);
    `);
    
    // Create rate_limits table (optional, can use in-memory)
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        user_id UUID,
        minute_bucket TIMESTAMP,
        request_count INT DEFAULT 1,
        PRIMARY KEY (user_id, minute_bucket)
      );
    `);
    console.log('✓ Rate limits table created');
    
    console.log('\n✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migrations if called directly
if (require.main === module) {
  createTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default createTables;
