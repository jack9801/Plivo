const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting custom Vercel build...');

// Check if Next.js is already installed correctly
try {
  console.log('📦 Installing dependencies with legacy peer deps...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });
  
  // Ensure @types/bcryptjs is installed
  console.log('📦 Installing TypeScript types for bcryptjs...');
  execSync('npm install --save-dev @types/bcryptjs --force', { stdio: 'inherit' });
  
  // Generate Prisma client
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Run the build
  console.log('🏗️ Building application...');
  execSync('next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} 