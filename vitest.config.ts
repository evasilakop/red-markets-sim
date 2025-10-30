import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [
            'src/tests/**/*.test.ts',
            'src/tests/**/*.test.tsx'
        ],
        environment: 'node', // switch to 'jsdom' for React component tests
        globals: true,
    },
});