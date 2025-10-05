# Railway Deployment Guide - Complete Walkthrough

## 🚂 Why Railway?

- ✅ **Free $5/month credit** for hobby projects
- ✅ **Built-in PostgreSQL** with pgvector support
- ✅ **One-click deployment** from GitHub
- ✅ **Automatic HTTPS** and custom domains
- ✅ **Easy environment variables** management
- ✅ **No credit card required** for free tier

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Your ResumeRAG code pushed to GitHub
- [x] OpenAI API key with credits

---

## 🚀 Step-by-Step Deployment

### **Step 1: Push Your Code to GitHub**

If you haven't already:

```powershell
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - ResumeRAG project"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/resumerag.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Sign Up for Railway**

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign in with **GitHub** (recommended for auto-deploy)
4. Authorize Railway to access your repositories

---

### **Step 3: Create a New Project**

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **resumerag** repository
4. Railway will detect it's a Node.js project

---

### **Step 4: Add PostgreSQL Database**

1. In your project dashboard, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create a PostgreSQL instance
3. Wait for it to provision (~30 seconds)

---

### **Step 5: Enable pgvector Extension**

1. Click on your **PostgreSQL service**
2. Go to **"Data"** tab
3. Click **"Query"** button
4. Run this SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
5. Click **"Execute"**
6. You should see: "Success: CREATE EXTENSION"

---

### **Step 6: Configure Environment Variables**

1. Click on your **app service** (not the database)
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these:

**Required Variables:**

```env
# Railway auto-generates DATABASE_URL, but verify it's there
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Add your OpenAI key
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-min-32-chars

# Port (Railway provides this automatically)
PORT=${{PORT}}

# Node environment
NODE_ENV=production

# File upload settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# CORS (allow all for now)
CORS_ORIGIN=*
```

4. Click **"Save"** after adding each variable

---

### **Step 7: Run Database Migrations**

Railway will auto-deploy, but migrations need to run manually first time:

1. In your app service, go to **"Settings"** tab
2. Scroll to **"Deploy Trigger"**
3. Under **"Deploy Command"**, add:
   ```bash
   npm run migrate && npm run build && npm start
   ```
4. Click **"Deploy"**

**OR** run migrations manually:

1. Click **"New"** → **"Service"** → **"Empty Service"**
2. In Settings, add this **Start Command**:
   ```bash
   npm run migrate
   ```
3. After it runs successfully, delete this service
4. Your main app will now work

---

### **Step 8: Deploy Frontend**

**Option A: Deploy Frontend on Railway (Recommended for simplicity)**

1. Click **"New"** → **"Service"** → **"GitHub Repo"**
2. Select the same repository
3. In **Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -p $PORT`
4. Add environment variable:
   ```env
   VITE_API_URL=https://YOUR-BACKEND-SERVICE.up.railway.app
   ```
5. Deploy!

**Option B: Deploy Frontend on Vercel/Netlify (Free + Fast CDN)**

For Vercel:
1. Go to https://vercel.com
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   ```env
   VITE_API_URL=https://YOUR-BACKEND-SERVICE.up.railway.app
   ```
5. Deploy!

---

### **Step 9: Update CORS Settings**

Once frontend is deployed, update backend CORS:

1. Go to Railway → Your backend service → Variables
2. Update `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```
3. Or keep it as `*` for testing (not recommended for production)

---

### **Step 10: Seed the Database (Optional)**

If you want sample data:

1. Go to your backend service in Railway
2. Click **"Settings"** → **"Service"** → **"Deploy Trigger"**
3. Click **"Deploy Now"**
4. In the deployment logs, run:
   ```bash
   npm run seed
   ```

**OR** create a one-time deployment:

1. Add a new service with Start Command: `npm run seed`
2. Let it run once
3. Delete the service

---

## 🎯 Verification Checklist

After deployment, verify everything works:

### Backend Health Check:
```bash
curl https://YOUR-BACKEND.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "embedding_service": "ready"
}
```

### Frontend:
1. Open your frontend URL
2. Login with: `admin@mail.com` / `admin123`
3. Try uploading a resume
4. Test semantic search
5. Test job matching

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:** 
- Check DATABASE_URL is set correctly
- Verify PostgreSQL service is running
- Make sure pgvector extension is installed

### Issue: "OpenAI API error"
**Solution:**
- Verify OPENAI_API_KEY is correct
- Check you have credits in OpenAI account
- Test key at https://platform.openai.com/playground

### Issue: "CORS error"
**Solution:**
- Update CORS_ORIGIN to match your frontend domain
- Or set to `*` for testing

### Issue: "Port already in use"
**Solution:**
- Railway auto-assigns PORT via environment variable
- Make sure your code uses `process.env.PORT`

---

## 💰 Cost Estimate

**Railway Free Tier:**
- $5/month execution credit
- Typical usage for this project: ~$3-4/month
- **Should stay within free tier for testing/demo**

**OpenAI API:**
- ~$0.0001 per embedding (text-embedding-3-small)
- 100 resumes ≈ $0.01
- 1000 searches ≈ $0.10
- **Budget $5-10/month for moderate use**

---

## 🔄 Auto-Deployment

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway detects the push and redeploys automatically!

---

## 🌐 Custom Domain (Optional)

1. Go to your service → **Settings** → **Domains**
2. Click **"Generate Domain"** for free Railway domain
3. Or add your own custom domain

---

## 📊 Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Database**: Query performance, storage

Access via your service dashboard.

---

## ✅ Production Checklist

Before going live:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Update CORS_ORIGIN to specific domain (not `*`)
- [ ] Set NODE_ENV=production
- [ ] Add credits to OpenAI account
- [ ] Test all endpoints
- [ ] Monitor logs for errors
- [ ] Set up database backups (Railway settings)

---

## 🎉 Your App is Live!

**Backend:** `https://resumerag-backend.up.railway.app`  
**Frontend:** `https://resumerag-frontend.vercel.app`  

**Default Login:**
- Email: `admin@mail.com`
- Password: `admin123`

---

## 📝 Quick Reference

### Useful Railway Commands:

```bash
# View logs
railway logs

# Run migrations
railway run npm run migrate

# Connect to database
railway connect postgres

# Set environment variable
railway variables set KEY=value
```

### Useful URLs:
- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- PostgreSQL GUI: Use TablePlus or pgAdmin with DATABASE_URL

---

**Need help?** Check Railway's excellent docs or their Discord community!
