# PowerShell script to automatically push Dockerfile changes to GitHub
Write-Host "Starting automatic GitHub push process..." -ForegroundColor Cyan

# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in PATH. Please install Git first." -ForegroundColor Red
    exit 1
}

# Add the Dockerfile to git staging
Write-Host "Adding Dockerfile to git staging..." -ForegroundColor Yellow
git add Dockerfile

# Commit the changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Improve Dockerfile with multi-stage build for smaller image size"

# Push to GitHub
Write-Host "Pushing changes to GitHub..." -ForegroundColor Yellow
git push origin main

# Check if push was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed changes to GitHub!" -ForegroundColor Green
} else {
    Write-Host "Failed to push changes. Check your credentials and repository access." -ForegroundColor Red
} 