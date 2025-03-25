// Ultra-minimal Vite config that works in every environment
// CommonJS format for maximum compatibility

module.exports = {
  root: '.',
  publicDir: 'public',
  plugins: [],
  build: {
    outDir: 'client/dist',
    emptyOutDir: true,
    minify: true
  }
};