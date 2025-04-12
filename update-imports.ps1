function Replace-InFiles {
    param (
        [string]$SearchPattern,
        [string]$ReplacePattern,
        [string]$FilePattern
    )
    
    Get-ChildItem -Path . -Recurse -Include $FilePattern | ForEach-Object {
        $content = Get-Content -Path $_.FullName -Raw
        if ($content -match $SearchPattern) {
            $newContent = $content -replace $SearchPattern, $ReplacePattern
            Set-Content -Path $_.FullName -Value $newContent
            Write-Host "Updated: $($_.FullName)"
        }
    }
}

Write-Host "Updating imports from @/lib/prisma to @/lib/db..."
Replace-InFiles -SearchPattern 'import\s+\{\s*prisma\s*\}\s+from\s+[''"]@/lib/prisma[''"]' -ReplacePattern 'import { prisma } from "@/lib/db"' -FilePattern "*.ts"
Replace-InFiles -SearchPattern 'import\s+\{\s*prisma\s*\}\s+from\s+[''"]@/lib/prisma[''"]' -ReplacePattern 'import { prisma } from "@/lib/db"' -FilePattern "*.tsx"

Write-Host "Import updates completed!" 