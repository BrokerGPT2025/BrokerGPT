// Simplified Vite configuration for builds - ESM version
// For use with package.json type:module projects

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Basic build settings
  root: '.',
  publicDir: 'public',
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  
  // Plugins
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'client/dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
    },
  },
  
  // JavaScript configuration
  esbuild: {
    jsxInject: "import React from 'react'",
  },
});