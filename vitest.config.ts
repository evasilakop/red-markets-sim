import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        include: [
            'src/tests/**/*.test.ts',
            'src/tests/**/*.test.tsx'
        ],
        environment: 'jsdom', // switch to 'jsdom' for React component tests, 'node'
        // is default
        globals: true,
        setupFiles: ['./src/tests/setup.ts'],
    },
});