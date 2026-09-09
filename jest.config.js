/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: true,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'cjs', 'mjs', 'json'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '<rootDir>/scripts/performance/__tests__/**/*.test.cjs',
  ],
  collectCoverageFrom: [
    'src/v3/**/*.ts',
    '!src/v3/**/__tests__/**',
    '!src/v3/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 90,
      lines: 90,
      functions: 90,
      branches: 85,
    },
  },
};
