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
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.js',
        'dist/',
        'mcp-server/',
        // Tauri lib files - integration tests pending
        'src/lib/tauri.js',
        'src/lib/artifacts.js',
        'src/lib/people.js',
        'src/lib/places.js',
        'src/lib/events.js',
        'src/lib/theories.js',
        'src/lib/upload.js',
        'src/lib/annotations.js',
        'src/lib/overlays.js',
        'src/lib/provenance.js',
        'src/lib/entityPages.js',
        'src/lib/artifact-sources.js',
      ],
      // Enforce minimum coverage thresholds
      thresholds: {
        statements: 40,
        branches: 40,
        functions: 30,
        lines: 40,
      },
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
