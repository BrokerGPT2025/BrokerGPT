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
    // Make sure Vite is installed
    try {
      console.log('Ensuring Vite is installed...');
      await runCommand('npm', ['install', 'vite', '--no-save']);
    } catch (installError) {
      console.log('Vite installation may have failed, but continuing anyway:', installError.message);
    }
    
    // Check for Vite in different locations
    console.log('Checking for Vite installation...');
    const possibleVitePaths = [
      path.join(process.cwd(), 'node_modules', '.bin', 'vite'),
      path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'),
      '/opt/render/project/node_modules/.bin/vite',
      '/opt/render/project/node_modules/vite/bin/vite.js'
    ];
    
    let viteFound = false;
    let vitePath = '';
    
    for (const potentialPath of possibleVitePaths) {
      if (fs.existsSync(potentialPath)) {
        console.log(`Found Vite at: ${potentialPath}`);
        vitePath = potentialPath;
        viteFound = true;
        break;
      }
    }
    
    if (!viteFound) {
      console.log('No Vite installation found in expected locations');
    }
    
    // Try multiple approaches to run Vite build
    const buildAttempts = [
      // Attempt 1: Use Vite directly (instead of npm script that might not exist)
      async () => {
        console.log('Attempt 1: Using vite build directly...');
        try {
          await runCommand('npx', ['vite', 'build']);
          return true;
        } catch (err) {
          console.log('Direct Vite build failed:', err.message);
          return false;
        }
      },
      
      // Attempt 2: Use direct Vite path
      async () => {
        if (viteFound) {
          console.log(`Attempt 2: Using direct Vite path: ${vitePath} build`);
          try {
            if (vitePath.endsWith('.js')) {
              await runCommand('node', [vitePath, 'build']);
            } else {
              await runCommand(vitePath, ['build']);
            }
            return true;
          } catch (err) {
            console.log('Direct Vite build failed:', err.message);
            return false;
          }
        }
        return false;
      },
      
      // Attempt 3: Use npx with custom NODE_PATH
      async () => {
        console.log('Attempt 3: Using npx with custom NODE_PATH...');
        try {
          await runCommand('npx', ['vite', 'build'], {
            env: {
              ...process.env,
              NODE_PATH: path.join(process.cwd(), 'node_modules')
            }
          });
          return true;
        } catch (err) {
          console.log('NPX with NODE_PATH build failed:', err.message);
          return false;
        }
      },
      
      // Attempt 4: Use global Vite if available
      async () => {
        console.log('Attempt 4: Checking for global Vite...');
        try {
          await runCommand('vite', ['build']);
          return true;
        } catch (err) {
          console.log('Global Vite build failed:', err.message);
          return false;
        }
      },
      
      // Attempt 5: Create vite config programmatically and run
      async () => {
        console.log('Attempt 5: Creating custom Vite config and running...');
        const tempViteConfigPath = path.join(process.cwd(), 'vite.config.temp.js');
        
        try {
          // Create a simplified Vite config
          const configContent = `
            // Temporary Vite config for build
            import { defineConfig } from 'vite';
            import react from '@vitejs/plugin-react';
            
            export default defineConfig({
              plugins: [react()],
              build: {
                outDir: 'client/dist',
                emptyOutDir: true
              }
            });
          `;
          
          fs.writeFileSync(tempViteConfigPath, configContent);
          await runCommand('npx', ['vite', 'build', '--config', tempViteConfigPath]);
          return true;
        } catch (err) {
          console.log('Custom config Vite build failed:', err.message);
          return false;
        } finally {
          // Clean up temp file
          if (fs.existsSync(tempViteConfigPath)) {
            fs.unlinkSync(tempViteConfigPath);
          }
        }
      }
    ];
    
    // Try build attempts in sequence
    let buildSuccess = false;
    for (let i = 0; i < buildAttempts.length; i++) {
      buildSuccess = await buildAttempts[i]();
      if (buildSuccess) {
        console.log(`Build attempt ${i + 1} succeeded!`);
        break;
      }
    }
    
    // Check if the build was successful by looking for index.html
    const clientDistDir = path.join(process.cwd(), 'client', 'dist');
    const indexHtmlPath = path.join(clientDistDir, 'index.html');
    
    if (fs.existsSync(indexHtmlPath)) {
      console.log('Vite build successful - index.html was created.');
      return true;
    } else {
      console.error('All build attempts completed but index.html is missing. Build may have failed.');
      
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