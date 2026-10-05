/**
 * Integration Test Setup
 *
 * Sets up the environment for integration tests that call the real Tauri backend.
 *
 * IMPORTANT: Integration tests require the Tauri app to be running!
 * Start the app with: npm run tauri dev
 *
 * These tests run automatically via the pre-commit hook if Tauri is detected.
 */

import { beforeAll, afterAll } from 'vitest';

// Mock Tauri API for integration tests
// Note: Integration tests require the actual Tauri app running in dev mode
global.window = global.window || ({} as any);
global.window.__TAURI__ = global.window.__TAURI__ || {};

beforeAll(async () => {
  console.log('🚀 Setting up integration tests...');
  console.log('   Expecting Tauri backend on port 1420');
});

afterAll(async () => {
  console.log('✅ Integration tests complete');
});
