import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/**/__tests__/**/*.test.ts',
      'test/**/*.test.ts',
      'scripts/performance/__tests__/**/*.test.cjs',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.d.ts'],
      reporter: ['text', 'text-summary', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
});
