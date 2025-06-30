import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');

  try {
    // Perform any cleanup operations here
    // For example:
    // - Clean up test data from database
    // - Reset application state
    // - Clean up uploaded files
    // - Clear caches

    // Optional: Send cleanup requests to backend API
    // const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    // await fetch(`${baseURL}/api/test/cleanup`, { method: 'POST' });

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

export default globalTeardown;
