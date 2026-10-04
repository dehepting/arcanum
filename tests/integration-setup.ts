/**
 * Integration Test Setup
 *
 * Sets up the environment for integration tests that call the real Tauri backend.
 * This runs before all integration tests.
 */

import { beforeAll, afterAll } from 'vitest';

// Mock Tauri API for integration tests
// Note: Integration tests will need the actual Tauri app running
// For now, we'll mock the invoke function to point to the real backend
global.window = global.window || ({} as any);
global.window.__TAURI__ = global.window.__TAURI__ || {};

beforeAll(async () => {
  console.log('🚀 Setting up integration tests...');

  // TODO: Start Tauri app in test mode
  // For now, tests will assume the app is running in dev mode
  // Future: Use tauri-driver or similar for automated testing
});

afterAll(async () => {
  console.log('✅ Integration tests complete');

  // TODO: Clean up test data
  // Future: Delete test projects, sources, etc.
});
