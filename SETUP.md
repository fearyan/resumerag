# ResumeRAG - Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies

```powershell
# Backend dependencies
npm install

# Frontend dependencies (in a separate terminal)
cd frontend
npm install
cd ..
```

### 2. Setup Database

```powershell
# Make sure PostgreSQL is running, then create database
psql -U postgres
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE resumerag;
\c resumerag
CREATE EXTENSION vector;
\q
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/resumerag
OPENAI_API_KEY=sk-your-openai-api-key-here
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
CORS_ORIGIN=*
```

**Important**: Replace `your_password` and get an OpenAI API key from https://platform.openai.com/api-keys

### 4. Run Migrations & Seed

```powershell
# Run database migrations
npm run migrate

# Seed with sample data
npm run seed
```

### 5. Start the Application

```powershell
# Terminal 1: Start backend (in root directory)
npm run dev

# Terminal 2: Start frontend (in frontend directory)
cd frontend
npm run dev
```

The backend will run on http://localhost:3000
The frontend will run on http://localhost:5173

## 📝 Default Login Credentials

**Admin Account**:
- Email: `admin@mail.com`
- Password: `admin123`
- Role: admin (can see PII)

**Recruiter Account**:
- Email: `recruiter@mail.com`
- Password: `recruiter123`
- Role: recruiter (can see PII)

## 🧪 Test the API

### Health Check
```powershell
curl http://localhost:3000/api/health
```

### Login
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@mail.com","password":"admin123"}'
```

### View Seeded Resumes
```powershell
# Replace <token> with the token from login response
curl http://localhost:3000/api/resumes `
  -H "Authorization: Bearer <token>"
```

### Semantic Search
```powershell
curl -X POST http://localhost:3000/api/ask `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token>" `
  -d '{"query":"Find Python developers with ML experience","k":5}'
```

### Job Matching
```powershell
# First get a job ID from the seeded jobs
curl http://localhost:3000/api/jobs -H "Authorization: Bearer <token>"

# Then match candidates (replace <job-id> with actual ID)
curl -X POST http://localhost:3000/api/jobs/<job-id>/match `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token>" `
  -d '{"top_n":10}'
```

## 📦 What's Included After Seeding

- **5 Sample Resumes**:
  1. John Doe - Senior Software Engineer (6 years)
  2. Jane Smith - ML Engineer (4 years)
  3. Bob Wilson - Full Stack Developer (3 years)
  4. Alice Chen - DevOps Engineer (5 years)
  5. Michael Brown - Data Scientist (4 years)

- **3 Sample Jobs**:
  1. Senior Backend Engineer
  2. Machine Learning Engineer
  3. Full Stack Developer

## 🔍 Key Features to Test

### 1. Resume Upload
- Go to http://localhost:5173/upload
- Upload PDF, DOCX, TXT, or ZIP files
- View processing status

### 2. Semantic Search
- Go to http://localhost:5173/search
- Try queries like:
  - "Find Python developers with machine learning experience"
  - "Who has experience with React and Node.js?"
  - "Find candidates with DevOps skills"

### 3. Job Matching
- Go to http://localhost:5173/jobs
- Click on a job to see details
- Click "Find Matching Candidates" to see ranked matches
- View match scores, matching/missing skills, and evidence

### 4. Test Rate Limiting
```powershell
# Run this script to test rate limiting (sends 65 requests)
for ($i=1; $i -le 65; $i++) {
  curl http://localhost:3000/api/resumes -H "Authorization: Bearer <token>"
  Write-Host "Request $i"
}
# Should get 429 error after request 61
```

### 5. Test Idempotency
```powershell
# Same idempotency key twice should return cached response
$key = [guid]::NewGuid()
curl -X POST http://localhost:3000/api/jobs `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token>" `
  -H "Idempotency-Key: $key" `
  -d '{"title":"Test Job","description":"Test","required_skills":["Python"],"experience_required":3,"location":"Remote"}'

# Run again with same key
curl -X POST http://localhost:3000/api/jobs `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token>" `
  -H "Idempotency-Key: $key" `
  -d '{"title":"Test Job","description":"Test","required_skills":["Python"],"experience_required":3,"location":"Remote"}'
```

### 6. Test PII Redaction
```powershell
# Login as regular user (not admin/recruiter)
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"user@test.com","password":"password123","role":"user"}'

# Get resumes - email/phone should be null or ***REDACTED***
curl http://localhost:3000/api/resumes -H "Authorization: Bearer <new-token>"
```

## 🛠️ Troubleshooting

### "Cannot connect to database"
- Make sure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check if database exists: `psql -U postgres -l`

### "pgvector extension not found"
```sql
-- Connect to database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### "OpenAI API error"
- Verify OPENAI_API_KEY is set in .env
- Check you have credits: https://platform.openai.com/usage
- Make sure the key starts with `sk-`

### "Port already in use"
- Backend: Change PORT in .env
- Frontend: Change port in `frontend/vite.config.ts`

### Dependencies not installing
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -r node_modules
npm install
```

## 📚 API Documentation

After starting the server, access:
- Health: http://localhost:3000/api/health
- Metadata: http://localhost:3000/api/_meta
- Manifest: http://localhost:3000/.well-known/hackathon.json

## 🎯 Judge Criteria Checklist

All required endpoints are implemented:
- ✅ `/api/health` - Service health status
- ✅ `/api/_meta` - API documentation
- ✅ `/.well-known/hackathon.json` - Hackathon manifest
- ✅ `/api/auth/register` & `/api/auth/login` - Authentication
- ✅ `/api/resumes` - Upload and list resumes
- ✅ `/api/resumes/:id` - Get resume details
- ✅ `/api/ask` - Semantic search
- ✅ `/api/jobs` - Job management
- ✅ `/api/jobs/:id/match` - Candidate matching

Features implemented:
- ✅ Pagination (limit, offset, next_offset)
- ✅ Idempotency (24hr TTL, conflict detection)
- ✅ Rate Limiting (60 req/min per user)
- ✅ PII Redaction (role-based)
- ✅ CORS (allow all origins)
- ✅ Error Handling (uniform format)
- ✅ File Processing (PDF/DOCX/ZIP)
- ✅ Embeddings (OpenAI text-embedding-3-small)
- ✅ Vector Search (pgvector cosine similarity)
- ✅ Deterministic Matching (skill 50%, exp 30%, semantic 20%)

## 🚢 Deployment Ready

The application is ready to deploy to:
- Railway
- Render
- Heroku
- Any platform with PostgreSQL + pgvector support

Just set the environment variables and run migrations!

---

**Need Help?** Check the main README.md for detailed API examples and architecture documentation.
