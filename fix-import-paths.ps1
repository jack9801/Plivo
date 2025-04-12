# PowerShell script to fix common import path errors in the project
Write-Host "Starting to fix import paths..." -ForegroundColor Cyan

# Set error action to stop on any error
$ErrorActionPreference = "Stop"

# Counter for fixed files
$fixedFiles = 0

# Function to replace text in files matching a pattern
function Replace-InFiles {
    param (
        [string]$SearchPattern,
        [string]$ReplacePattern,
        [string]$FilePattern
    )
    
    $files = Get-ChildItem -Path . -Recurse -Include $FilePattern | 
        Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.next\*" }
    
    foreach ($file in $files) {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if ($content -match $SearchPattern) {
            Write-Host "Fixing import in: $($file.FullName)" -ForegroundColor Yellow
            $newContent = $content -replace $SearchPattern, $ReplacePattern
            [System.IO.File]::WriteAllText($file.FullName, $newContent)
            $script:fixedFiles++
        }
    }
}

# Fix incorrect Prisma imports (from @/lib/db to @/lib/prisma)
Write-Host "Fixing Prisma imports..." -ForegroundColor Yellow
Replace-InFiles -SearchPattern 'import\s+\{\s*prisma\s*\}\s+from\s+[''"]@/lib/db[''"]' -ReplacePattern 'import { prisma } from "@/lib/prisma"' -FilePattern "*.ts"
Replace-InFiles -SearchPattern 'import\s+\{\s*prisma\s*\}\s+from\s+[''"]@/lib/db[''"]' -ReplacePattern 'import { prisma } from "@/lib/prisma"' -FilePattern "*.tsx"

# Fix incorrect useToast hook imports
Write-Host "Fixing useToast imports..." -ForegroundColor Yellow
Replace-InFiles -SearchPattern 'import\s+\{\s*useToast\s*\}\s+from\s+[''"]@/hooks/use-toast[''"]' -ReplacePattern 'import { useToast } from "@/components/ui/use-toast"' -FilePattern "*.tsx"
Replace-InFiles -SearchPattern 'import\s+\{\s*useToast\s*\}\s+from\s+[''"]@/hooks/use-toast[''"]' -ReplacePattern 'import { useToast } from "@/components/ui/use-toast"' -FilePattern "*.ts"

Write-Host "Import path fixing completed! Fixed $fixedFiles files." -ForegroundColor Green
if ($fixedFiles -gt 0) {
    Write-Host "Remember to commit the changes with: git add . && git commit -m 'Fix import paths' && git push origin main" -ForegroundColor Cyan
} else {
    Write-Host "No files needed fixing." -ForegroundColor Green
} 