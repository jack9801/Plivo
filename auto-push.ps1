# PowerShell script to automatically commit and push Dockerfile changes
Write-Host "Starting automatic GitHub push process..." -ForegroundColor Cyan

# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in PATH. Please install Git first." -ForegroundColor Red
    exit 1
}

# Show current git status
Write-Host "Current git status:" -ForegroundColor Yellow
git status

# Check if there's an in-progress rebase and abort if needed
$rebaseInProgress = git status | Select-String -Pattern "rebase in progress"
if ($rebaseInProgress) {
    Write-Host "Rebase in progress, aborting rebase..." -ForegroundColor Yellow
    git rebase --abort
}

# Add all modified files to git staging
Write-Host "Adding all modified files to git staging..." -ForegroundColor Yellow
git add app/api/organizations/[id]/route.ts
git add app/api/organizations/route.ts
git add app/api/subscriptions/route.ts
git add app/api/test-email/route.ts
git add app/api/test-systems/route.ts
git add app/api/services/route.ts
git add app/api/team/route.ts
git add Dockerfile render.yaml render-deploy.md

# Check if there are changes to commit
$changes = git diff --cached --name-only
if (!$changes) {
    Write-Host "No changes detected in the tracked files. Nothing to commit." -ForegroundColor Yellow
    exit 0
}

# Commit the changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Fix TypeScript errors in API routes including Member model fields"

# Push to GitHub
Write-Host "Pushing changes to GitHub..." -ForegroundColor Yellow
git push origin main

# Check if push was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed changes to GitHub!" -ForegroundColor Green
} else {
    Write-Host "Failed to push changes. Check your credentials and repository access." -ForegroundColor Red
    
    # Provide instructions for manual push
    Write-Host "`nIf you need to authenticate, you can try manually:" -ForegroundColor Yellow
    Write-Host "1. git push -u origin main" -ForegroundColor White
    Write-Host "2. Enter your GitHub username and personal access token when prompted" -ForegroundColor White
} 