// ESM-compatible Vite build script
import { build } from 'vite';

async function buildApp() {
  try {
    await build({
      configFile: './vite.config.js',
      root: process.cwd(),
      logLevel: 'info',
      mode: 'production'
    });
    console.log('Vite build completed via API');
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

buildApp();