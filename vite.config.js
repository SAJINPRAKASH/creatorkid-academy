import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures compatible paths for github pages deployments
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
});
