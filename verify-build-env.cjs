// Verify build environment and dependencies (CommonJS version)
// This script checks for necessary build tools and environment setup

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

// Make exec return a Promise
const execPromise = promisify(exec);

// __dirname is already available in CommonJS
console.log('Verifying build environment (CommonJS)...');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);

// Essential packages for build
const requiredPackages = [
  'vite',
  'esbuild',
  '@vitejs/plugin-react',
  'react',
  'tailwindcss'
];

// Essential environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PATH'
];

async function verifyNpmPackages() {
  console.log('\nChecking required npm packages:');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found! This is a critical error.');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let allFound = true;
  const allDependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };
  
  for (const packageName of requiredPackages) {
    if (allDependencies[packageName]) {
      const nodeModulesPath = path.join(process.cwd(), 'node_modules', packageName);
      if (fs.existsSync(nodeModulesPath)) {
        console.log(`✅ ${packageName} - Package found in node_modules`);
      } else {
        console.warn(`⚠️ ${packageName} - Listed in package.json but not installed in node_modules`);
        allFound = false;
      }
    } else {
      console.error(`❌ ${packageName} - Not listed in package.json!`);
      allFound = false;
    }
  }
  
  if (!allFound) {
    console.warn('Some required packages are missing. Consider running "npm install" to fix this.');
  }
  
  return allFound;
}

async function verifyEnvironmentVariables() {
  console.log('\nChecking required environment variables:');
  
  let allFound = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} = ${envVar === 'PATH' ? 'Path exists (not showing full value)' : process.env[envVar]}`);
    } else {
      console.error(`❌ ${envVar} - Not defined!`);
      allFound = false;
    }
  }
  
  if (!allFound) {
    console.warn('Some required environment variables are missing.');
  }
  
  return allFound;
}

async function verifyExecutables() {
  console.log('\nChecking required executables:');
  
  const executables = ['node', 'npm', 'npx', 'vite', 'esbuild'];
  
  let allFound = true;
  for (const exe of executables) {
    try {
      const { stdout } = await execPromise(`which ${exe} || echo "not found"`);
      if (stdout.trim() !== "not found") {
        console.log(`✅ ${exe} - Found at ${stdout.trim()}`);
      } else {
        console.error(`❌ ${exe} - Not found in PATH!`);
        allFound = false;
      }
    } catch (error) {
      console.error(`❌ ${exe} - Error checking: ${error.message}`);
      allFound = false;
    }
  }
  
  return allFound;
}

async function verifyViteConfig() {
  console.log('\nChecking Vite configuration:');
  
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  const viteConfigJsPath = path.join(process.cwd(), 'vite.config.js');
  
  if (fs.existsSync(viteConfigPath)) {
    console.log(`✅ vite.config.ts found`);
    return true;
  } else if (fs.existsSync(viteConfigJsPath)) {
    console.log(`✅ vite.config.js found`);
    return true;
  } else {
    console.error(`❌ No Vite configuration file found!`);
    return false;
  }
}

async function verifyNodeModulesPermissions() {
  console.log('\nChecking node_modules permissions:');
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.error(`❌ node_modules directory not found!`);
    return false;
  }
  
  try {
    // Try to write a temp file to verify write permissions
    const testFilePath = path.join(nodeModulesPath, '.permission-test');
    fs.writeFileSync(testFilePath, 'test');
    fs.unlinkSync(testFilePath);
    console.log(`✅ node_modules directory is writable`);
    return true;
  } catch (error) {
    console.error(`❌ node_modules directory is not writable: ${error.message}`);
    return false;
  }
}

async function verifyBuildDirectories() {
  console.log('\nChecking build output directories:');
  
  const distDir = path.join(process.cwd(), 'dist');
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  
  // Check if directories exist and are writable
  const directories = [
    { path: distDir, name: 'dist' },
    { path: clientDistDir, name: 'client/dist' }
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir.path)) {
      try {
        fs.mkdirSync(dir.path, { recursive: true });
        console.log(`✅ ${dir.name} directory created successfully`);
      } catch (error) {
        console.error(`❌ Failed to create ${dir.name} directory: ${error.message}`);
        return false;
      }
    } else {
      console.log(`✅ ${dir.name} directory already exists`);
    }
    
    // Check if directory is writable
    try {
      const testFilePath = path.join(dir.path, '.permission-test');
      fs.writeFileSync(testFilePath, 'test');
      fs.unlinkSync(testFilePath);
      console.log(`✅ ${dir.name} directory is writable`);
    } catch (error) {
      console.error(`❌ ${dir.name} directory is not writable: ${error.message}`);
      return false;
    }
  }
  
  return true;
}

async function main() {
  try {
    // We need to run these sequentially in CommonJS to avoid issues
    const npmPackagesResult = await verifyNpmPackages();
    const envVarsResult = await verifyEnvironmentVariables();
    const executablesResult = await verifyExecutables();
    const viteConfigResult = await verifyViteConfig();
    const nodeModulesPermissionsResult = await verifyNodeModulesPermissions();
    const buildDirsResult = await verifyBuildDirectories();
    
    const results = [
      npmPackagesResult,
      envVarsResult,
      executablesResult, 
      viteConfigResult,
      nodeModulesPermissionsResult,
      buildDirsResult
    ];
    
    const allPassed = results.every(result => result);
    
    console.log('\n------------------------------');
    if (allPassed) {
      console.log('✅ All checks passed! Build environment looks good.');
    } else {
      console.error('⚠️ Some checks failed. The build might encounter issues.');
      console.log('Consider fixing the issues above before proceeding with the build.');
    }
    console.log('------------------------------');
    
    // Return success status (0 for success, 1 for issues)
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Error during environment verification:', error);
    process.exit(1);
  }
}

// Run the main function
main();