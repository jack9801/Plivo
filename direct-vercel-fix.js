// This script can be pasted directly into Vercel's build console if needed

const fs = require('fs');

console.log('🚀 Manual Vercel deployment fix...');
console.log('Current directory: ' + process.cwd());

try {
  // Fix package.json
  const packageJson = {
    "name": "status-page-fresh",
    "version": "0.1.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "NODE_ENV=production node server.js",
      "start:win": "set NODE_ENV=production && node server.js",
      "lint": "next lint"
    },
    "dependencies": {
      "@clerk/nextjs": "^4.27.2", // Compatible version with Next.js 14.1.0
      "@prisma/client": "^5.10.2",
      "@radix-ui/react-avatar": "^1.0.4",
      "@radix-ui/react-dialog": "^1.0.5",
      "@radix-ui/react-dropdown-menu": "^2.0.6",
      "@radix-ui/react-label": "^2.1.3",
      "@radix-ui/react-select": "^2.1.7",
      "@radix-ui/react-slot": "^1.2.0",
      "@radix-ui/react-tabs": "^1.0.4",
      "@radix-ui/react-toast": "^1.2.7",
      "bcryptjs": "2.4.3",
      "class-variance-authority": "^0.7.1",
      "clsx": "^2.1.1",
      "dotenv": "^16.4.7",
      "lucide-react": "^0.487.0",
      "next": "14.1.0",
      "next-auth": "4.24.5",
      "next-themes": "^0.2.1",
      "nodemailer": "^6.10.0",
      "prisma": "5.10.2",
      "react": "18.2.0",
      "react-dom": "18.2.0",
      "recharts": "^2.15.2",
      "socket.io": "^4.7.4",
      "socket.io-client": "^4.7.4",
      "tailwind-merge": "^2.6.0",
      "tailwindcss-animate": "^1.0.7"
    },
    "devDependencies": {
      "@types/bcryptjs": "^2.4.6",
      "@types/node": "20.11.0",
      "@types/react": "18.2.0",
      "@types/react-dom": "18.2.0",
      "autoprefixer": "10.4.17",
      "postcss": "8.4.35",
      "tailwindcss": "3.4.1",
      "typescript": "5.0.4"
    }
  };

  // Remove comments from package.json before writing
  const packageJsonString = JSON.stringify(packageJson, null, 2)
    .replace(/,\s*\/\/.*$/gm, ',') // Remove comments at end of lines
    .replace(/\/\/.*$/gm, '');     // Remove any remaining comments

  // Write the files
  fs.writeFileSync('package.json', packageJsonString);
  fs.writeFileSync('.npmrc', 'legacy-peer-deps=true\nforce=true\n');
  
  console.log('✅ Successfully fixed deployment files');
  
  // Install with force
  console.log('📦 Installing dependencies with fixed package.json...');
  const { execSync } = require('child_process');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });
  
  // Continue with build
  console.log('🏗️ Building application...');
  execSync('next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Error in direct fix:', error);
  process.exit(1);
} 