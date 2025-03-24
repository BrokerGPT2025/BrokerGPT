#!/usr/bin/env node
// Verification script for Vite installation
// Run this to check if Vite is properly installed and configured
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🔍 VITE INSTALLATION VERIFICATION");
console.log(`Running in directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Helper function to check if a file or directory exists
function exists(p) {
  return fs.existsSync(p);
}

// Helper function to execute shell commands
function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`Command failed: ${command}`);
      console.error(error.message);
    }
    return null;
  }
}

// Check for package.json
if (!exists('./package.json')) {
  console.error("❌ No package.json found in the current directory!");
  process.exit(1);
}

// Read package.json
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
} catch (e) {
  console.error("❌ Error reading package.json:", e.message);
  process.exit(1);
}

// Check Vite in dependencies/devDependencies
const hasViteInDeps = packageJson.dependencies && packageJson.dependencies.vite;
const hasViteInDevDeps = packageJson.devDependencies && packageJson.devDependencies.vite;

if (hasViteInDeps || hasViteInDevDeps) {
  console.log("✅ Vite is listed in package.json");
  console.log(`   Location: ${hasViteInDeps ? 'dependencies' : 'devDependencies'}`);
  console.log(`   Version: ${hasViteInDeps ? packageJson.dependencies.vite : packageJson.devDependencies.vite}`);
} else {
  console.warn("⚠️ Vite is not listed in package.json dependencies!");
}

// Check for node_modules/vite
if (exists('./node_modules/vite')) {
  console.log("✅ Vite directory found in node_modules");
  
  // Check for Vite binary
  if (exists('./node_modules/.bin/vite')) {
    console.log("✅ Vite binary found in node_modules/.bin");
  } else if (exists('./node_modules/vite/bin/vite.js')) {
    console.log("✅ Vite script found in node_modules/vite/bin");
    console.log("⚠️ But no binary symlink in node_modules/.bin");
  } else {
    console.warn("⚠️ No Vite binary or script found in expected locations!");
  }
} else {
  console.warn("⚠️ Vite directory not found in node_modules!");
}

// Check vite.config files
if (exists('./vite.config.js')) {
  console.log("✅ vite.config.js found");
} else {
  console.warn("⚠️ No vite.config.js found");
}

if (exists('./vite.config.ts')) {
  console.log("✅ vite.config.ts found");
} else {
  console.warn("⚠️ No vite.config.ts found");
}

// Check PATH environment variable
console.log("\nChecking PATH environment variable...");
console.log(`PATH: ${process.env.PATH || 'Not set'}`);

// Try to run Vite version check
console.log("\nAttempting to run Vite version check...");
const viteVersion = exec('npx vite --version', { silent: true, ignoreError: true });

if (viteVersion) {
  console.log(`✅ Vite version: ${viteVersion.trim()}`);
} else {
  console.error("❌ Failed to determine Vite version");
  
  // Try direct path
  console.log("Trying direct path to Vite...");
  
  if (exists('./node_modules/vite/bin/vite.js')) {
    const directViteVersion = exec('node ./node_modules/vite/bin/vite.js --version', { silent: true, ignoreError: true });
    
    if (directViteVersion) {
      console.log(`✅ Vite version (direct path): ${directViteVersion.trim()}`);
    } else {
      console.error("❌ Failed to run Vite directly");
    }
  }
}

// Try installing Vite globally if it's not working
if (!viteVersion) {
  console.log("\nAttempting to install Vite globally...");
  exec('npm install -g vite', { ignoreError: true });
  
  const globalViteVersion = exec('vite --version', { silent: true, ignoreError: true });
  
  if (globalViteVersion) {
    console.log(`✅ Global Vite version: ${globalViteVersion.trim()}`);
  } else {
    console.error("❌ Failed to install or run Vite globally");
  }
}

// Verify React plugin
console.log("\nChecking for React plugin...");
if (exists('./node_modules/@vitejs/plugin-react')) {
  console.log("✅ @vitejs/plugin-react found");
} else {
  console.warn("⚠️ @vitejs/plugin-react not found! This is required for React projects");
}

// Check for client/index.html
if (exists('./client/index.html')) {
  console.log("✅ Found client/index.html (entry point)");
} else {
  console.warn("⚠️ No client/index.html found! This is the expected entry point");
}

// Summary
console.log("\n📋 SUMMARY");
if (
  (hasViteInDeps || hasViteInDevDeps) &&
  exists('./node_modules/vite') &&
  (exists('./vite.config.js') || exists('./vite.config.ts')) &&
  (exists('./node_modules/.bin/vite') || exists('./node_modules/vite/bin/vite.js')) &&
  viteVersion
) {
  console.log("✅ Vite appears to be correctly installed and configured");
} else {
  console.log("⚠️ There are issues with the Vite installation or configuration");
  console.log("   See warnings above for details");
}

// Print environment variables for debugging
console.log("\n🔍 ENVIRONMENT VARIABLES");
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`PORT: ${process.env.PORT || 'Not set'}`);
console.log(`NODE_OPTIONS: ${process.env.NODE_OPTIONS || 'Not set'}`);

// Recommended actions
console.log("\n📝 RECOMMENDED ACTIONS");
if (!hasViteInDeps && !hasViteInDevDeps) {
  console.log("1. Add Vite to your dependencies: npm install vite --save-dev");
}
if (!exists('./node_modules/vite')) {
  console.log("2. Install dependencies: npm install");
}
if (!exists('./vite.config.js') && !exists('./vite.config.ts')) {
  console.log("3. Create a vite.config.js file for your project");
}
if (!exists('./node_modules/@vitejs/plugin-react')) {
  console.log("4. Install React plugin: npm install @vitejs/plugin-react --save-dev");
}
if (!exists('./client/index.html')) {
  console.log("5. Create a client/index.html entry point file");
}

console.log("\nVerification complete!");