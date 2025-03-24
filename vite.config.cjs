/**
 * CommonJS version of Vite configuration
 * This helps deployment tools like Render.com that may struggle with ESM modules
 */

'use strict';

const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  // Basic build settings
  root: path.resolve(__dirname, 'client'),
  publicDir: 'public',
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  
  // Plugins
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: path.resolve(__dirname, 'client/dist'),
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
  },
  
  // JavaScript configuration
  esbuild: {
    jsxInject: "import React from 'react'",
  },
});