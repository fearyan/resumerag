# Deployment Checklist for ResumeRAG Hackathon Submission

## ✅ Pre-Deployment Verification

### 1. Local Testing
- [ ] All endpoints responding correctly
- [ ] Health check returns proper status
- [ ] Metadata endpoint accessible
- [ ] Hackathon manifest available at `/.well-known/hackathon.json`
- [ ] Sample data seeded successfully
- [ ] Frontend connects to backend
- [ ] Login works with admin@mail.com / admin123

### 2. API Compliance
- [ ] All required endpoints implemented:
  - GET /api/health
  - GET /api/_meta
  - GET /.well-known/hackathon.json
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/resumes
  - GET /api/resumes
  - GET /api/resumes/:id
  - POST /api/ask
  - POST /api/jobs
  - GET /api/jobs
  - GET /api/jobs/:id
  - POST /api/jobs/:id/match

- [ ] Response schemas match specification
- [ ] Error responses use uniform format
- [ ] CORS enabled for all origins
- [ ] Rate limiting works (60 req/min/user)
- [ ] Idempotency prevents duplicates
- [ ] Pagination returns next_offset correctly
- [ ] PII redaction based on role

## 🚀 Deployment Steps

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will provide DATABASE_URL automatically

4. **Enable pgvector**
   - In PostgreSQL service, go to "Connect"
   - Copy connection string
   - Use pgAdmin or psql to connect
   - Run: `CREATE EXTENSION vector;`

5. **Set Environment Variables**
   - Go to your service → "Variables"
   - Add:
     ```
     OPENAI_API_KEY=sk-your-key-here
     JWT_SECRET=production-secret-key-change-this
     PORT=3000
     NODE_ENV=production
     MAX_FILE_SIZE=10485760
     UPLOAD_DIR=./uploads
     CORS_ORIGIN=*
     ```

6. **Run Migrations**
   - In "Settings" → "Deploy"
   - Add custom start command: `npm run migrate && npm run seed && npm start`
   - Or use "Terminal" to run manually:
     ```
     npm run migrate
     npm run seed
     ```

7. **Get Deployment URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Update `team_name` and `api_base_url` in `src/index.ts` (hackathon.json endpoint)

### Option 2: Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard → "New +" → "PostgreSQL"
   - Select free tier
   - Name it "resumerag-db"
   - Copy "Internal Database URL"

3. **Enable pgvector**
   - In database dashboard, go to "Shell"
   - Run: `CREATE EXTENSION vector;`

4. **Create Web Service**
   - "New +" → "Web Service"
   - Connect GitHub repository
   - Settings:
     - **Name**: resumerag-api
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

5. **Environment Variables**
   - Add variables:
     ```
     DATABASE_URL=(paste internal database URL)
     OPENAI_API_KEY=sk-your-key-here
     JWT_SECRET=production-secret-key
     PORT=3000
     NODE_ENV=production
     ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Run migrations via Shell: `npm run migrate && npm run seed`

## 📋 Post-Deployment Verification

### Test All Endpoints

```bash
# Replace BASE_URL with your deployment URL
BASE_URL="https://your-app.railway.app"

# 1. Health Check
curl $BASE_URL/api/health

# 2. Metadata
curl $BASE_URL/api/_meta

# 3. Hackathon Manifest
curl $BASE_URL/.well-known/hackathon.json

# 4. Login
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"admin123"}'

# Save token from response, then test other endpoints
TOKEN="your-token-here"

# 5. List Resumes
curl $BASE_URL/api/resumes -H "Authorization: Bearer $TOKEN"

# 6. Semantic Search
curl -X POST $BASE_URL/api/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"Find Python developers","k":5}'

# 7. Job Matching
curl $BASE_URL/api/jobs -H "Authorization: Bearer $TOKEN"
# Get a job ID from response, then:
curl -X POST $BASE_URL/api/jobs/JOB_ID/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"top_n":10}'
```

### Verify Judge Requirements

- [ ] Health endpoint returns 200 with correct schema
- [ ] Metadata endpoint lists all endpoints
- [ ] Hackathon manifest has:
  - team_name
  - problem_statement: "ResumeRAG"
  - api_base_url (your deployment URL)
  - demo_credentials (admin@mail.com / admin123)
  - All endpoints listed
  - All features: true

- [ ] Login with demo credentials works
- [ ] Semantic search returns relevant results
- [ ] Job matching returns ranked candidates
- [ ] Pagination works (next_offset returned)
- [ ] Idempotency prevents duplicates
- [ ] Rate limit enforced (test with >60 requests)
- [ ] PII redacted for non-recruiter users
- [ ] CORS allows requests from any origin

## 📝 Submission Checklist

### README.md Must Include
- [ ] Architecture note (100-200 words)
- [ ] Setup instructions
- [ ] API summary with all endpoints
- [ ] Example requests with curl/JavaScript
- [ ] Demo credentials clearly stated
- [ ] Pagination documentation
- [ ] Idempotency documentation
- [ ] Rate limiting documentation
- [ ] Error handling examples
- [ ] Seed data description

### Code Quality
- [ ] TypeScript with proper types
- [ ] Consistent error handling
- [ ] Proper validation
- [ ] Clean code structure
- [ ] Comments for complex logic
- [ ] No hardcoded credentials in code
- [ ] Environment variables documented

### Repository
- [ ] .gitignore includes node_modules, .env, dist
- [ ] package.json has all scripts
- [ ] README.md is comprehensive
- [ ] SETUP.md with quick start guide
- [ ] All source files committed
- [ ] No sensitive data committed

## 🎯 Final Submission

1. **Update Hackathon Manifest**
   - Edit `src/index.ts` line ~35
   - Set `team_name` to your team name
   - Set `api_base_url` to your deployment URL

2. **Create Submission Document**
   ```markdown
   # ResumeRAG Submission

   **Team Name**: Your Team Name
   **Problem Statement**: ResumeRAG
   **Deployment URL**: https://your-app.railway.app
   **Repository URL**: https://github.com/your-username/resumerag

   ## Demo Credentials
   - Email: admin@mail.com
   - Password: admin123

   ## Key Features
   - Semantic resume search using OpenAI embeddings
   - Deterministic job matching algorithm
   - Rate limiting, idempotency, PII redaction
   - Full pagination support
   - React frontend with Tailwind CSS

   ## API Endpoints
   - Health: https://your-app.railway.app/api/health
   - Metadata: https://your-app.railway.app/api/_meta
   - Manifest: https://your-app.railway.app/.well-known/hackathon.json

   ## Technology Stack
   - Backend: Node.js, Express, TypeScript
   - Database: PostgreSQL with pgvector
   - Embeddings: OpenAI text-embedding-3-small
   - Frontend: React, Vite, Tailwind CSS
   ```

3. **Test One More Time**
   - All judge test cases pass
   - Demo credentials work
   - All features functional
   - No errors in logs

4. **Submit!**
   - Repository URL
   - Deployment URL
   - Demo credentials
   - Any additional documentation

## 🔧 Troubleshooting Deployment Issues

### Database Connection Errors
- Verify DATABASE_URL is correct
- Check if pgvector extension is enabled
- Ensure database allows connections from your app

### Migration Failures
- Run migrations manually via shell
- Check PostgreSQL logs
- Verify database permissions

### OpenAI API Errors
- Verify API key is valid
- Check you have credits
- Test API key locally first

### CORS Errors
- Ensure CORS_ORIGIN=* in production
- Check middleware order in Express app
- Verify OPTIONS requests handled

### Memory/Timeout Issues
- Increase instance size if needed
- Optimize embedding generation (batch processing)
- Add timeout handling for long operations

## 📊 Performance Optimization

If experiencing slowness:

1. **Add Database Indexes** (already included in migrations)
2. **Cache Embeddings** (already implemented)
3. **Batch Process Files** (modify if needed)
4. **Use Connection Pooling** (already configured)

## 🏆 Success Criteria

Your deployment is ready when:
- ✅ All 3 mandatory endpoints return correct data
- ✅ Demo credentials login successfully
- ✅ Sample resumes searchable
- ✅ Job matching returns ranked results
- ✅ All features work as documented
- ✅ No errors in production logs
- ✅ Response times < 5 seconds

**Good luck with your submission! 🚀**

---

Need help? Review the main README.md for detailed documentation.
