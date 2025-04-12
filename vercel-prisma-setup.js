// vercel-prisma-setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Prisma for Vercel deployment...');

try {
  // Check if we're on Vercel
  const isVercel = process.env.VERCEL === '1';
  console.log(`Running on Vercel: ${isVercel ? 'Yes' : 'No'}`);

  // Make sure prisma directory exists and is copied
  if (isVercel) {
    console.log('Ensuring Prisma schema is accessible...');
    // Create prisma dir if it doesn't exist
    if (!fs.existsSync('./prisma')) {
      fs.mkdirSync('./prisma', { recursive: true });
    }
  }

  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Verify Prisma client was generated
  const prismaClientPath = path.join('node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('✅ Prisma client successfully generated!');
  } else {
    console.warn('⚠️ Prisma client generation might have failed. Path not found:', prismaClientPath);
  }

  // Create a marker file to indicate success
  fs.writeFileSync('.prisma-generated', new Date().toISOString());
  console.log('✅ Prisma setup complete!');
} catch (error) {
  console.error('❌ Error during Prisma setup:', error);
  process.exit(1);
} 