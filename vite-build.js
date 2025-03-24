// Enhanced Vite build script for production deployment
// This script focuses on building the frontend via Vite
// Using ESM syntax based on package.json type:module setting

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting enhanced Vite build process...');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Ensure theme.json exists (required for shadcn-ui theme)
const themeJsonPath = path.join(process.cwd(), 'theme.json');
if (!fs.existsSync(themeJsonPath)) {
  console.log('Creating theme.json...');
  const defaultTheme = {
    primary: "#0087FF",
    variant: "professional",
    appearance: "light",
    radius: 0.5
  };
  fs.writeFileSync(themeJsonPath, JSON.stringify(defaultTheme, null, 2));
}

// Function to run a command with proper logging
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Command completed successfully: ${command}`);
        resolve();
      } else {
        console.error(`Command failed with code ${code}: ${command}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    childProcess.on('error', (err) => {
      console.error(`Failed to start command: ${err.message}`);
      reject(err);
    });
  });
}

async function buildFrontend() {
  try {
    // Determine the best way to call Vite
    const viteLocalPath = path.join(process.cwd(), 'node_modules', '.bin', 'vite');
    let viteCommand = 'npx';
    let viteArgs = ['vite', 'build'];
    
    // Check if local vite exists and use it directly if possible
    if (fs.existsSync(viteLocalPath)) {
      console.log(`Found local Vite installation at: ${viteLocalPath}`);
      viteCommand = viteLocalPath;
      viteArgs = ['build'];
    } else {
      console.log('No local Vite installation found, using npx fallback');
    }
    
    // 1. Run vite build for frontend
    console.log(`Building frontend with command: ${viteCommand} ${viteArgs.join(' ')}`);
    try {
      await runCommand(viteCommand, viteArgs);
    } catch (buildError) {
      console.error('First build attempt failed, trying alternative method...');
      
      // Try alternate build method using node_modules directly
      try {
        // In ESM, we can't use require.resolve, so construct the path manually
        const vitePath = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
        console.log(`Attempting to use Vite from: ${vitePath}`);
        if (fs.existsSync(vitePath)) {
          await runCommand('node', [vitePath, 'build']);
        } else {
          throw new Error('Vite executable not found at expected path');
        }
      } catch (altBuildError) {
        // Try one more fallback with NODE_PATH set
        console.error('Second build attempt failed, trying with NODE_PATH...');
        await runCommand('npx', ['vite', 'build'], {
          env: {
            ...process.env,
            NODE_PATH: path.join(process.cwd(), 'node_modules')
          }
        });
      }
    }
    
    // Check if the build was successful
    const clientDistDir = path.join(process.cwd(), 'client', 'dist');
    const indexHtmlPath = path.join(clientDistDir, 'index.html');
    
    if (fs.existsSync(indexHtmlPath)) {
      console.log('Vite build successful - index.html was created.');
      return true;
    } else {
      console.error('Vite build completed but index.html is missing. Build may have failed.');
      
      // Check if output went to a different location
      const possibleLocations = [
        path.join(process.cwd(), 'dist'),
        path.join(process.cwd(), 'dist', 'client'),
        path.join(process.cwd(), 'dist', 'public')
      ];
      
      for (const location of possibleLocations) {
        const altIndexPath = path.join(location, 'index.html');
        if (fs.existsSync(altIndexPath)) {
          console.log(`Found index.html in alternate location: ${location}`);
          console.log('Copying files to expected location...');
          
          if (!fs.existsSync(clientDistDir)) {
            fs.mkdirSync(clientDistDir, { recursive: true });
          }
          
          // Copy files from this location to client/dist
          const files = fs.readdirSync(location);
          for (const file of files) {
            const srcPath = path.join(location, file);
            const destPath = path.join(clientDistDir, file);
            
            if (fs.statSync(srcPath).isDirectory()) {
              // Recursive copy for directories
              fs.mkdirSync(destPath, { recursive: true });
              const subfiles = fs.readdirSync(srcPath);
              for (const subfile of subfiles) {
                const subSrcPath = path.join(srcPath, subfile);
                const subDestPath = path.join(destPath, subfile);
                fs.copyFileSync(subSrcPath, subDestPath);
              }
            } else {
              // Simple copy for files
              fs.copyFileSync(srcPath, destPath);
            }
          }
          
          console.log('Files copied successfully!');
          return true;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('Frontend build failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    // Attempt to build the frontend
    const frontendSuccess = await buildFrontend();
    
    if (frontendSuccess) {
      console.log('Frontend build completed successfully!');
    } else {
      console.log('Frontend build had issues, manual verification recommended.');
    }
    
    // List contents for verification
    const clientDistDir = path.join(process.cwd(), 'client', 'dist');
    if (fs.existsSync(clientDistDir)) {
      console.log('Contents of client/dist directory:');
      fs.readdirSync(clientDistDir).forEach(file => {
        console.log(` - ${file}`);
      });
    }
    
  } catch (error) {
    console.error('Build process failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error in build script:', err);
  process.exit(1);
});