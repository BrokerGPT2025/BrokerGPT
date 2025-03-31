import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr' // Import svgr plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add explicit configuration for svgr
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: {
        // Config options here if needed, e.g., icon: true
      },
      // esbuild options, if needed
      esbuildOptions: {
        // ...
      },
      // Specify files to include
      include: "**/*.svg",
      // Specify files to exclude
      exclude: "",
    })
  ],
})
