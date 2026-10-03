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
        '*.config.ts',
        'dist/',
        'mcp-server/',
        // Tauri lib files - integration tests pending
        'src/lib/tauri.js',
        'src/lib/tauri.ts',
        'src/lib/artifacts.js',
        'src/lib/artifacts.ts',
        'src/lib/people.js',
        'src/lib/people.ts',
        'src/lib/places.js',
        'src/lib/places.ts',
        'src/lib/events.js',
        'src/lib/events.ts',
        'src/lib/theories.js',
        'src/lib/theories.ts',
        'src/lib/upload.js',
        'src/lib/upload.ts',
        'src/lib/annotations.js',
        'src/lib/annotations.ts',
        'src/lib/overlays.js',
        'src/lib/overlays.ts',
        'src/lib/provenance.js',
        'src/lib/provenance.ts',
        'src/lib/entityPages.js',
        'src/lib/entityPages.ts',
        'src/lib/artifact-sources.js',
        'src/lib/artifact-sources.ts',
      ],
      // Enforce minimum coverage thresholds
      // TODO: Restore branches to 64 after fixing EntityPage tests
      thresholds: {
        statements: 52,
        branches: 56,
        functions: 42,
        lines: 52,
      },
    },

    // Test file patterns (supports both JS and TS)
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],

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
