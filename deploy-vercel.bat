@echo off
echo Starting Vercel deployment process...

REM Check if Vercel CLI is installed
echo Checking for Vercel CLI...
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI is not installed. Installing now...
    call npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install Vercel CLI.
        exit /b 1
    ) else (
        echo Vercel CLI installed successfully.
    )
) else (
    echo Vercel CLI is already installed.
)

REM Check if git is installed
echo Checking for Git...
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed. Please install Git before continuing.
    exit /b 1
) else (
    echo Git is installed.
)

REM Commit any changes
echo Checking for uncommitted changes...
git status
echo.
set /p COMMIT_MSG="Enter a commit message (or press Enter to skip commit): "
if not "%COMMIT_MSG%"=="" (
    git add .
    git commit -m "%COMMIT_MSG%"
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to commit changes.
        exit /b 1
    ) else (
        echo Changes committed successfully.
    )
)

REM Push to git if possible
echo.
set /p PUSH_CONFIRM="Would you like to push changes to git? (Y/N): "
if /i "%PUSH_CONFIRM%"=="Y" (
    git push
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to push changes to git.
        echo Continuing with deployment...
    ) else (
        echo Changes pushed to git successfully.
    )
)

REM Deploy to Vercel
echo.
echo Deploying to Vercel...
vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo Failed to deploy to Vercel.
    exit /b 1
) else (
    echo Deployment completed successfully!
)

echo.
echo If this is your first deployment, you may need to set up environment variables in the Vercel dashboard:
echo - DATABASE_URL: Your PostgreSQL connection string
echo - JWT_SECRET: A secure random string for JWT token signing
echo - EMAIL_* variables for email notifications
echo.
echo You can find these settings under Project Settings -^> Environment Variables

pause 