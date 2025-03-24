// Simplified Vite configuration for builds
// This file is specifically designed to help Render.com deployments work properly
// Can be used alongside the TypeScript version (vite.config.ts)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  // Basic build settings
  root: '.',
  publicDir: 'public',
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
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
        main: resolve(__dirname, 'client/index.html'),
      },
    },
  },
  
  // JavaScript configuration
  esbuild: {
    jsxInject: "import React from 'react'",
  },
});