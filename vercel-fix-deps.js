const fs = require('fs');

console.log('📦 Fixing package.json for Vercel deployment...');

try {
  // Read the current package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Fix the @clerk/nextjs dependency
  if (packageJson.dependencies['@clerk/nextjs']) {
    console.log('Found @clerk/nextjs dependency. Downgrading to compatible version...');
    packageJson.dependencies['@clerk/nextjs'] = '^4.27.2';
    console.log('Successfully downgraded @clerk/nextjs to ^4.27.2');
  }
  
  // Ensure @types/bcryptjs is in devDependencies
  if (!packageJson.devDependencies['@types/bcryptjs']) {
    console.log('Adding @types/bcryptjs to devDependencies...');
    packageJson.devDependencies['@types/bcryptjs'] = '^2.4.6';
    console.log('Successfully added @types/bcryptjs');
  }
  
  // Add .npmrc contents for better compatibility
  console.log('Creating .npmrc file for better dependency resolution...');
  fs.writeFileSync('.npmrc', 'legacy-peer-deps=true\nforce=true\n');
  console.log('Successfully created .npmrc file');
  
  // Write the fixed package.json
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Successfully fixed package.json for Vercel deployment');
} catch (error) {
  console.error('❌ Error fixing package.json:', error);
  process.exit(1);
} 