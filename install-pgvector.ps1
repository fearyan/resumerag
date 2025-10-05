# Install pgvector extension for PostgreSQL 18 on Windows

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "pgvector Installation for PostgreSQL 18" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "pgvector needs to be compiled and installed for PostgreSQL 18." -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use pre-built binaries (if available)" -ForegroundColor Cyan
Write-Host "  1. Download from: https://github.com/pgvector/pgvector/releases" -ForegroundColor White
Write-Host "  2. Extract the .dll file to: C:\Program Files\PostgreSQL\18\lib" -ForegroundColor White
Write-Host "  3. Extract the .sql files to: C:\Program Files\PostgreSQL\18\share\extension" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use Docker (Recommended - Easiest)" -ForegroundColor Cyan
Write-Host "  The project includes a docker-compose.yml with PostgreSQL + pgvector" -ForegroundColor White
Write-Host "  Run: docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Use Cloud Database (Fastest)" -ForegroundColor Cyan
Write-Host "  • Supabase (https://supabase.com) - pgvector pre-installed" -ForegroundColor White
Write-Host "  • Neon (https://neon.tech) - supports pgvector" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Would you like to try downloading pgvector binaries automatically? (y/n)"

if ($choice -eq "y") {
    Write-Host ""
    Write-Host "Attempting to download pgvector..." -ForegroundColor Yellow
    
    $downloadUrl = "https://github.com/pgvector/pgvector/archive/refs/tags/v0.5.1.zip"
    $tempZip = "$env:TEMP\pgvector.zip"
    
    try {
        Write-Host "Downloading pgvector source..." -ForegroundColor White
        Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip
        
        Write-Host "⚠️  Note: Building from source requires Visual Studio and PostgreSQL development headers" -ForegroundColor Yellow
        Write-Host "This is complex on Windows. Consider using Docker instead." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Would you like to switch to Docker? (y/n)" -ForegroundColor Cyan
        $dockerChoice = Read-Host
        
        if ($dockerChoice -eq "y") {
            Write-Host ""
            Write-Host "Setting up Docker environment..." -ForegroundColor Green
            Write-Host "Run these commands:" -ForegroundColor Yellow
            Write-Host "  docker-compose up -d" -ForegroundColor White
            Write-Host "  npm install" -ForegroundColor White
            Write-Host "  npm run migrate" -ForegroundColor White
            Write-Host "  npm run seed" -ForegroundColor White
        }
    } catch {
        Write-Host "❌ Download failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Please choose one of the options above to proceed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
