// vercel-prisma-setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Prisma for Vercel deployment...');

try {
  // Check if we're on Vercel
  const isVercel = process.env.VERCEL === '1';
  console.log(`Running on Vercel: ${isVercel ? 'Yes' : 'No'}`);

  // Log database connection info (without exposing credentials)
  const dbUrl = process.env.DATABASE_URL || '';
  const dbType = dbUrl.split(':')[0];
  const dbHost = dbUrl.includes('@') ? dbUrl.split('@')[1].split(':')[0] : 'unknown';
  
  console.log(`Database type: ${dbType}`);
  console.log(`Database host: ${dbHost}`);
  
  // Make sure prisma directory exists and is copied
  if (isVercel) {
    console.log('Ensuring Prisma schema is accessible...');
    // Create prisma dir if it doesn't exist
    if (!fs.existsSync('./prisma')) {
      fs.mkdirSync('./prisma', { recursive: true });
    }
  }

  // Force correct DATABASE_URL in case multiple DB variables are present
  if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
    console.log('Setting DATABASE_URL from POSTGRES_URL');
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }

  // Generate Prisma client with specific database URL if available
  console.log('Generating Prisma client...');
  
  // Add additional logging
  console.log('Prisma schema path:', path.resolve('./prisma/schema.prisma'));
  console.log('Current directory:', process.cwd());
  
  // List files in prisma directory to ensure schema is there
  if (fs.existsSync('./prisma')) {
    console.log('Prisma directory contents:', fs.readdirSync('./prisma'));
  }
  
  // Generate Prisma client
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Verify Prisma client was generated
  const prismaClientPath = path.join('node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('✅ Prisma client successfully generated!');
  } else {
    console.warn('⚠️ Prisma client generation might have failed. Path not found:', prismaClientPath);
  }

  // Create a marker file to indicate build mode on Vercel
  if (isVercel) {
    // Set a marker that other parts of the app can check
    fs.writeFileSync('.vercel-build', 'true');
    console.log('✅ Vercel build marker created');
  }

  // Create a marker file to indicate success
  fs.writeFileSync('.prisma-generated', new Date().toISOString());
  console.log('✅ Prisma setup complete!');
} catch (error) {
  console.error('❌ Error during Prisma setup:', error);
  process.exit(1);
} 