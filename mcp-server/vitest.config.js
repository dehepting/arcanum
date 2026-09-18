import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment - use node for MCP server
    environment: 'node',

    // Setup files
    setupFiles: ['./src/test/setup.js'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', '*.config.js', 'dist/'],
      // Enforce minimum coverage thresholds
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },

    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,ts}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist'],

    // Reporter
    reporters: ['verbose'],

    // Watch mode
    watch: false,
  },
});
