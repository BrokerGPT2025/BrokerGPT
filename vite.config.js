// Simplified Vite configuration for builds
// CommonJS compatible version that works in all environments

module.exports = {
  // Basic build settings
  root: '.',
  publicDir: 'public',
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': require('path').resolve(__dirname, './client/src'),
    },
  },
  
  // Plugins
  plugins: [require('@vitejs/plugin-react')()],
  
  // Build configuration
  build: {
    outDir: 'client/dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: require('path').resolve(__dirname, 'client/index.html'),
      },
    },
  },
  
  // JavaScript configuration
  esbuild: {
    jsxInject: "import React from 'react'",
  },
};