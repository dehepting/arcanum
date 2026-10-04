import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    name: 'integration',
    include: ['src/**/*.integration.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'src-tauri/target'],
    environment: 'node',
    setupFiles: ['./tests/integration-setup.ts'],
    testTimeout: 10000, // Integration tests can be slower
    hookTimeout: 10000,
    // Run integration tests sequentially to avoid DB conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
