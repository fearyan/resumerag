# ResumeRAG - Semantic Resume Search & Job Matching

## Architecture

ResumeRAG is a full-stack application built with **Node.js/Express** and **PostgreSQL with pgvector** for high-performance vector similarity search. The system processes uploaded resumes (PDF/DOCX/ZIP) using **pdf-parse** and **mammoth**, extracting structured data including names, contact information, skills, and experience. Resume content is embedded using **OpenAI's text-embedding-3-small model** (1536 dimensions) to enable semantic search capabilities.

The job matching algorithm employs a deterministic scoring system combining **skill overlap (50%)**, **experience alignment (30%)**, and **semantic similarity (20%)** to rank candidates consistently. Rate limiting is implemented using **NodeCache** with per-user sliding windows (60 req/min), while idempotency keys are cached with 24-hour TTL to prevent duplicate resource creation. The **React + Vite + Tailwind CSS** frontend provides intuitive interfaces for uploading resumes, performing semantic searches, and matching candidates to jobs. Role-based PII redaction ensures email and phone numbers are only visible to recruiters and admins, enforced at the API layer.

## Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ with pgvector extension
- OpenAI API key (for embeddings)

### Installation

1. **Clone repository**:
   ```bash
   git clone <your-repo-url>
   cd Skillion
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup PostgreSQL with pgvector**:
   ```sql
   CREATE DATABASE resumerag;
   \c resumerag
   CREATE EXTENSION vector;
   ```

4. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resumerag
   OPENAI_API_KEY=sk-your-openai-api-key-here
   JWT_SECRET=your-secret-key-change-in-production
   PORT=3000
   NODE_ENV=development
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads
   CORS_ORIGIN=*
   ```

5. **Run migrations**:
   ```bash
   npm run migrate
   ```

6. **Seed database** (creates sample data):
   ```bash
   npm run seed
   ```
   This creates:
   - Admin user: admin@mail.com / admin123
   - Recruiter user: recruiter@mail.com / recruiter123
   - 5 sample resumes with various skill sets
   - 3 job postings

7. **Start server**:
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:3000

## Test Credentials

**Admin Account** (full access including PII):
- **Email**: admin@mail.com
- **Password**: admin123
- **Role**: admin

**Recruiter Account** (can view PII):
- **Email**: recruiter@mail.com
- **Password**: recruiter123
- **Role**: recruiter

## API Summary

### Health & Metadata
- **GET /api/health** - Service health status
- **GET /api/_meta** - API documentation and limits
- **GET /.well-known/hackathon.json** - Hackathon manifest

### Authentication
- **POST /api/auth/register** - Create new user account
- **POST /api/auth/login** - Authenticate and receive JWT token

### Resume Management
- **POST /api/resumes** - Upload resume(s) (PDF/DOCX/ZIP)
- **GET /api/resumes?limit=&offset=&q=** - List/search resumes with pagination
- **GET /api/resumes/:id** - Get full resume details

### Semantic Search
- **POST /api/ask** - Ask natural language questions about candidates

### Job Management & Matching
- **POST /api/jobs** - Create new job posting
- **GET /api/jobs?limit=&offset=** - List jobs with pagination
- **GET /api/jobs/:id** - Get job details
- **POST /api/jobs/:id/match** - Find matching candidates for job

## API Examples

### Register & Login

**Register a new user**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "recruiter"
  }'
```

Response:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "recruiter"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mail.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "user": {
    "id": "abc-123",
    "email": "admin@mail.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Upload Resume

```bash
curl -X POST http://localhost:3000/api/resumes \
  -H "Authorization: Bearer <your-token>" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -F "files=@resume.pdf"
```

**Multiple files**:
```bash
curl -X POST http://localhost:3000/api/resumes \
  -H "Authorization: Bearer <your-token>" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001" \
  -F "files=@resume1.pdf" \
  -F "files=@resume2.docx"
```

Response:
```json
{
  "resumes": [
    {
      "id": "resume-uuid-1",
      "filename": "resume.pdf",
      "status": "completed",
      "uploaded_at": "2025-10-05T10:30:00.000Z"
    }
  ]
}
```

### List Resumes with Pagination

```bash
curl -X GET "http://localhost:3000/api/resumes?limit=2&offset=0" \
  -H "Authorization: Bearer <your-token>"
```

Response:
```json
{
  "items": [
    {
      "id": "resume-uuid-1",
      "filename": "john_doe_senior_engineer.pdf",
      "candidate_name": "John Doe",
      "email": "john.doe@email.com",
      "phone": "+1234567890",
      "skills": ["JavaScript", "Python", "React", "Node.js"],
      "experience_years": 6,
      "uploaded_at": "2025-10-05T10:00:00.000Z"
    },
    {
      "id": "resume-uuid-2",
      "filename": "jane_smith_ml_engineer.pdf",
      "candidate_name": "Jane Smith",
      "email": null,
      "phone": null,
      "skills": ["Python", "TensorFlow", "PyTorch"],
      "experience_years": 4,
      "uploaded_at": "2025-10-05T09:30:00.000Z"
    }
  ],
  "next_offset": 2
}
```

### Get Resume Details

```bash
curl -X GET http://localhost:3000/api/resumes/resume-uuid-1 \
  -H "Authorization: Bearer <your-token>"
```

Response:
```json
{
  "id": "resume-uuid-1",
  "filename": "john_doe_senior_engineer.pdf",
  "raw_text": "John Doe\\njohn.doe@email.com\\n+1234567890\\n\\nSUMMARY...",
  "parsed_data": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1234567890",
    "skills": ["JavaScript", "Python", "React", "Node.js"],
    "experience": ["Senior Software Engineer - Tech Corp (2020-Present)"],
    "education": ["Bachelor of Science in Computer Science - MIT (2018)"],
    "summary": "Senior Software Engineer with 6 years of experience...",
    "experience_years": 6
  },
  "uploaded_at": "2025-10-05T10:00:00.000Z"
}
```

### Search Candidates (Semantic Search)

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "query": "Find Python developers with machine learning experience",
    "k": 5
  }'
```

Response:
```json
{
  "query": "Find Python developers with machine learning experience",
  "answers": [
    {
      "resume_id": "resume-uuid-2",
      "candidate_name": "Jane Smith",
      "snippet": "...Machine Learning Engineer with PhD in Computer Science and 4 years of industry experience. Expert in deep learning and NLP. Developed NLP models using TensorFlow and PyTorch...",
      "relevance_score": 0.92,
      "metadata": {
        "filename": "jane_smith_ml_engineer.pdf",
        "section": "experience"
      }
    },
    {
      "resume_id": "resume-uuid-5",
      "candidate_name": "Michael Brown",
      "snippet": "...Data Scientist with 4 years of experience in statistical analysis and machine learning. Built predictive models using machine learning algorithms. Performed statistical analysis...",
      "relevance_score": 0.85,
      "metadata": {
        "filename": "michael_brown_data_scientist.pdf",
        "section": "experience"
      }
    }
  ]
}
```

### Create Job Posting

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -H "Idempotency-Key: 650e8400-e29b-41d4-a716-446655440002" \
  -d '{
    "title": "Senior Backend Engineer",
    "description": "We are looking for a Senior Backend Engineer to join our team.",
    "required_skills": ["Python", "Node.js", "PostgreSQL", "Docker"],
    "experience_required": 5,
    "location": "San Francisco, CA"
  }'
```

Response:
```json
{
  "id": "job-uuid-1",
  "title": "Senior Backend Engineer",
  "created_at": "2025-10-05T11:00:00.000Z"
}
```

### Match Candidates to Job

```bash
curl -X POST http://localhost:3000/api/jobs/job-uuid-1/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{ "top_n": 10 }'
```

Response:
```json
{
  "job_id": "job-uuid-1",
  "matches": [
    {
      "resume_id": "resume-uuid-1",
      "candidate_name": "John Doe",
      "match_score": 87.5,
      "matching_skills": ["Python", "Node.js", "PostgreSQL", "Docker"],
      "missing_skills": [],
      "evidence": "Has 4 matching skill(s): Python, Node.js, PostgreSQL. 6 years of experience (meets 5 year requirement). Profile: Senior Software Engineer with 6 years of experience in full-stack development...",
      "experience_match": true
    },
    {
      "resume_id": "resume-uuid-4",
      "candidate_name": "Alice Chen",
      "match_score": 82.3,
      "matching_skills": ["Python", "PostgreSQL", "Docker"],
      "missing_skills": ["Node.js"],
      "evidence": "Has 3 matching skill(s): Python, PostgreSQL, Docker. 5 years of experience (meets 5 year requirement). Profile: DevOps Engineer with 5 years of experience...",
      "experience_match": true
    }
  ],
  "ranked_by": "deterministic_score"
}
```

## Pagination

All list endpoints (`/api/resumes`, `/api/jobs`) support pagination via query parameters:

- **`?limit=20`** - Number of items per page (default: 20, max: 100)
- **`?offset=0`** - Starting position (default: 0)

Response includes `next_offset` field:
- `next_offset: null` indicates end of results
- `next_offset: 40` means next page starts at offset 40

**Example**:
```bash
# First page
GET /api/resumes?limit=20&offset=0
# Response: { items: [...], next_offset: 20 }

# Second page
GET /api/resumes?limit=20&offset=20
# Response: { items: [...], next_offset: 40 }

# Last page
GET /api/resumes?limit=20&offset=80
# Response: { items: [...], next_offset: null }
```

## Idempotency

All resource-creating POST endpoints (`/api/resumes`, `/api/jobs`) accept an `Idempotency-Key` header to prevent duplicate submissions:

```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

**Behavior**:
- Same key + same payload = returns cached 200 response
- Same key + different payload = returns 409 conflict error
- Keys expire after 24 hours

**Example**:
```bash
# First request
curl -X POST http://localhost:3000/api/resumes \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -F "files=@resume.pdf"
# Returns: 201 Created

# Duplicate request (same key, same payload)
curl -X POST http://localhost:3000/api/resumes \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -F "files=@resume.pdf"
# Returns: 200 OK (cached response)

# Conflicting request (same key, different payload)
curl -X POST http://localhost:3000/api/resumes \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -F "files=@different_resume.pdf"
# Returns: 409 Conflict
```

## Rate Limiting

**Limit**: 60 requests per minute per authenticated user

When limit is exceeded, the API returns a 429 status:

```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Rate limit exceeded. Try again in 30 seconds."
  }
}
```

**Response Headers**:
- `X-RateLimit-Remaining: 45` - Requests left in current window
- `X-RateLimit-Reset: 1696512600` - Unix timestamp when limit resets

**Example**:
```bash
curl -i http://localhost:3000/api/resumes \
  -H "Authorization: Bearer <token>"

# Response headers:
HTTP/1.1 200 OK
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1696512660
```

## Seed Data

Run `npm run seed` to populate the database with:

### Users
- **admin@mail.com** / **admin123** (admin role)
- **recruiter@mail.com** / **recruiter123** (recruiter role)

### Sample Resumes (5)
1. **John Doe** - Senior Software Engineer (6 years, JavaScript/Python/React/Node.js)
2. **Jane Smith** - ML Engineer (4 years, Python/TensorFlow/PyTorch/NLP)
3. **Bob Wilson** - Full Stack Developer (3 years, React/Node.js/MongoDB)
4. **Alice Chen** - DevOps Engineer (5 years, AWS/Kubernetes/Docker)
5. **Michael Brown** - Data Scientist (4 years, Python/R/Machine Learning)

### Sample Jobs (3)
1. **Senior Backend Engineer** - Requires Python, Node.js, PostgreSQL, Docker (5 years)
2. **Machine Learning Engineer** - Requires Python, TensorFlow, PyTorch, ML, NLP (3 years)
3. **Full Stack Developer** - Requires React, Node.js, JavaScript, MongoDB (3 years)

## Error Handling

All errors follow a uniform format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "field": "fieldname",
    "message": "Human-readable message"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `RATE_LIMIT` | 429 | Too many requests (60/min exceeded) |
| `FIELD_REQUIRED` | 400 | Missing required field |
| `UNAUTHORIZED` | 401 | Invalid/missing auth token |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_FILE` | 400 | Unsupported file type or corrupt file |
| `PROCESSING_ERROR` | 500 | Resume parsing failed |
| `USER_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `IDEMPOTENCY_CONFLICT` | 409 | Idempotency key reused with different payload |

**Example**:
```json
{
  "error": {
    "code": "FIELD_REQUIRED",
    "field": "email",
    "message": "Email is required"
  }
}
```

## Testing

Run the test suite:
```bash
npm test
```

The test suite covers:
- ✅ Resume upload and parsing (PDF/DOCX/ZIP)
- ✅ Semantic search accuracy
- ✅ Job matching algorithm correctness
- ✅ Pagination edge cases (next_offset calculation)
- ✅ Idempotency enforcement
- ✅ Rate limiting (60 req/min per user)
- ✅ PII redaction by role
- ✅ CORS headers
- ✅ Health and metadata endpoints

## CORS

CORS is enabled for all origins during judging:

```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Idempotency-Key
Access-Control-Expose-Headers: X-RateLimit-Remaining, X-RateLimit-Reset
```

Preflight OPTIONS requests are handled automatically.

## Deployment

### Environment Setup
1. Deploy to Railway, Render, or similar platform
2. Provision PostgreSQL 14+ with pgvector extension
3. Set all environment variables from `.env.example`
4. Run migrations: `npm run migrate`
5. Seed database: `npm run seed`

### Required Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/resumerag
OPENAI_API_KEY=sk-...
JWT_SECRET=production-secret-key
PORT=3000
NODE_ENV=production
```

### Verify Deployment
1. Check health: `GET https://your-domain.com/api/health`
2. Check metadata: `GET https://your-domain.com/api/_meta`
3. Check manifest: `GET https://your-domain.com/.well-known/hackathon.json`
4. Test login with admin@mail.com / admin123

## Project Structure

```
Skillion/
├── src/
│   ├── config/
│   │   └── index.ts                 # Environment configuration
│   ├── database/
│   │   ├── pool.ts                  # PostgreSQL connection pool
│   │   ├── migrate.ts               # Database migrations
│   │   └── seed.ts                  # Seed data script
│   ├── middleware/
│   │   ├── auth.ts                  # JWT authentication
│   │   ├── errorHandler.ts          # Global error handler
│   │   ├── idempotency.ts           # Idempotency key handling
│   │   └── rateLimit.ts             # Rate limiting (60 req/min)
│   ├── routes/
│   │   ├── meta.ts                  # Health & metadata endpoints
│   │   ├── auth.ts                  # Authentication routes
│   │   ├── resumes.ts               # Resume management
│   │   ├── ask.ts                   # Semantic search
│   │   └── jobs.ts                  # Job management & matching
│   ├── utils/
│   │   ├── fileProcessing.ts        # PDF/DOCX/ZIP parsing
│   │   └── embeddings.ts            # OpenAI embedding service
│   └── index.ts                     # Express app entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Tech Stack

- **Backend**: Node.js 20, Express 4, TypeScript 5
- **Database**: PostgreSQL 14 with pgvector extension
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **File Processing**: pdf-parse, mammoth, adm-zip
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **Caching**: NodeCache (rate limits, idempotency)
- **File Upload**: multer

## Troubleshooting

### "Cannot connect to database"
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check pgvector extension is installed: `CREATE EXTENSION vector;`

### "Embedding generation failed"
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key has credits available
- Ensure internet connectivity

### "Rate limit errors immediately"
- Clear NodeCache or restart server
- Check system time is correct (used for minute buckets)

### "PII not redacted"
- Verify user role is not 'recruiter' or 'admin'
- Check JWT token contains correct role

## License

MIT

## Support

For questions or issues:
1. Check the API documentation: `GET /api/_meta`
2. Verify health status: `GET /api/health`
3. Review error messages (they're descriptive!)
4. Check logs for detailed error traces

---

**Built for the ResumeRAG Hackathon** 🚀
