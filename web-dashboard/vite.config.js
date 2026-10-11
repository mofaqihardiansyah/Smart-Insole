import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the vendors out of the app chunk.
         *
         * As one file this bundle was 983 kB, almost all of it Firebase and
         * React. That single chunk has to be re-downloaded whenever any app
         * string changes. Separating the libraries means the app chunk stays
         * small and the vendor chunks stay cached across deploys, which is the
         * difference between a good and a poor LCP on a ward's mobile
         * connection.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase')) {
            // Storage is only reachable through a dynamic import (the optional
            // profile photo upload). Returning undefined here lets Rollup give
            // it its own chunk so it is never part of the initial download.
            if (id.includes('firebase/storage')) return undefined;
            return 'firebase';
          }
          if (id.includes('@firebase')) {
            if (id.includes('@firebase/storage')) return undefined;
            return 'firebase';
          }
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/') ||
            id.includes('react-router')
          ) {
            return 'react';
          }
          if (id.includes('lucide-react')) return 'icons';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: false,
  },
});
