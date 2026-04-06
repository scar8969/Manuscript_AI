import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['api/lib/**/*.test.ts', 'api/auth/**/*.test.ts', 'api/documents/**/*.test.ts']
  }
});
