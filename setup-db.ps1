# Database Setup Script for ResumeRAG
# Run this script to create and initialize the database

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "ResumeRAG Database Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL path
$PSQL = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "Step 1: Enter your PostgreSQL password" -ForegroundColor Yellow
Write-Host "(This is the password you set during PostgreSQL installation)" -ForegroundColor Gray
Write-Host ""

# Prompt for password
$Password = Read-Host "Enter postgres password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable for password
$env:PGPASSWORD = $PlainPassword

Write-Host ""
Write-Host "Step 2: Creating database 'resumerag'..." -ForegroundColor Yellow

try {
    & $PSQL -U postgres -c "CREATE DATABASE resumerag;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created successfully!" -ForegroundColor Green
    } else {
        # Database might already exist
        Write-Host "⚠️  Database might already exist (this is OK)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Database creation failed (might already exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Installing pgvector extension..." -ForegroundColor Yellow

# Check if pgvector is available
$vectorCheck = & $PSQL -U postgres -d resumerag -c "SELECT * FROM pg_available_extensions WHERE name='vector';" -t 2>&1

if ($vectorCheck -match "vector") {
    Write-Host "✅ pgvector extension is available!" -ForegroundColor Green
    
    try {
        & $PSQL -U postgres -d resumerag -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 | Out-Null
        Write-Host "✅ pgvector extension installed!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install pgvector extension" -ForegroundColor Red
        Write-Host "You may need to install it manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ pgvector extension NOT found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "pgvector is not installed. You need to install it:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://github.com/pgvector/pgvector/releases" -ForegroundColor Cyan
    Write-Host "2. Or install via:" -ForegroundColor Cyan
    Write-Host "   - Stack Builder (comes with PostgreSQL)" -ForegroundColor Gray
    Write-Host "   - Manual build (requires Visual Studio)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternative: Use Docker with pre-built pgvector image" -ForegroundColor Yellow
    Write-Host ""
    
    # Save connection string for manual setup
    $connString = "postgresql://postgres:$PlainPassword@localhost:5432/resumerag"
    Write-Host "Your connection string (save to .env file):" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=$connString" -ForegroundColor Cyan
    
    # Clear password from memory
    $env:PGPASSWORD = $null
    
    Write-Host ""
    Write-Host "Setup incomplete - pgvector required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Saving connection string to .env file..." -ForegroundColor Yellow

# Create .env file
$envContent = @"
# Database Configuration
DATABASE_URL=postgresql://postgres:$PlainPassword@localhost:5432/resumerag

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI Configuration (REQUIRED - get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key-here

# File Upload Configuration
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads

# CORS Configuration
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Pagination
MAX_PAGINATION_LIMIT=100
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Host "✅ .env file created!" -ForegroundColor Green

# Clear password from memory
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Database Setup Complete! ✨" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file and add your OpenAI API key" -ForegroundColor White
Write-Host "   Get one from: https://platform.openai.com/api-keys" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Install dependencies:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Run database migrations:" -ForegroundColor White
Write-Host "   npm run migrate" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Seed with sample data:" -ForegroundColor White
Write-Host "   npm run seed" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Start the frontend (in a new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
