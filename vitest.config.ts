import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['test/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts'],
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
