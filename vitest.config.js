import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'happy-dom',

    // Setup files
    setupFiles: ['./src/test/setup.js'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '*.config.js', 'dist/', 'mcp-server/'],
    },

    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,jsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'mcp-server'],

    // Reporter
    reporters: ['verbose'],

    // Watch mode - helpful for development
    watch: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
