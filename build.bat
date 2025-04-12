@echo off
echo Starting Status Page build process on Windows...

REM Check for Node.js
echo Checking for Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js before continuing.
    exit /b 1
) else (
    echo Node.js is installed.
)

REM Check for npm
echo Checking for npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed. Please install npm before continuing.
    exit /b 1
) else (
    echo npm is installed.
)

REM Create .npmrc if it doesn't exist
if not exist ".npmrc" (
    echo Creating .npmrc file...
    echo legacy-peer-deps=true > .npmrc
    echo .npmrc file created.
)

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps --force
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies.
    exit /b 1
) else (
    echo Dependencies installed.
)

REM Generate Prisma client
echo Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo Failed to generate Prisma client.
    exit /b 1
) else (
    echo Prisma client generated.
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from example...
    if exist ".env.example" (
        copy .env.example .env
        echo .env file created from example. Please update it with your actual values.
    ) else (
        echo .env.example not found. Creating minimal .env file.
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/statuspage > .env
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env
        echo Minimal .env file created. Please update it with your actual values.
    )
)

REM Fix clerk dependency version
echo Updating @clerk/nextjs to version 4.27.2...
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('./package.json'));p.dependencies['@clerk/nextjs']='4.27.2';fs.writeFileSync('./package.json',JSON.stringify(p,null,2))"
if %ERRORLEVEL% NEQ 0 (
    echo Failed to update @clerk/nextjs version.
    exit /b 1
) else (
    echo @clerk/nextjs version updated in package.json.
    call npm install --legacy-peer-deps --force
    echo @clerk/nextjs updated to version 4.27.2.
)

REM Run the Vercel Prisma setup
echo Running Vercel Prisma setup...
node vercel-prisma-setup.js
if %ERRORLEVEL% NEQ 0 (
    echo Failed to run Vercel Prisma setup.
    exit /b 1
) else (
    echo Vercel Prisma setup completed.
)

REM Build the application
echo Building application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed.
    exit /b 1
) else (
    echo Build completed successfully!
)

echo Build process completed! You can now run 'npm run start:win' to start the application.
pause 