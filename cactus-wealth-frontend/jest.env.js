// Environment variables for Jest testing

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock API endpoints
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock authentication secrets (for testing purposes only)
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Disable telemetry
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Mock database URL (if needed for API route testing)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Set timezone to avoid test inconsistencies
process.env.TZ = 'UTC';
