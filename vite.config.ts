import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Increase the warning limit to 1000kb (1mb) to silence the warning
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manually split large dependencies into separate chunks
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'react-qr-code'],
          'vendor-charts': ['recharts']
        }
      }
    }
  }
});