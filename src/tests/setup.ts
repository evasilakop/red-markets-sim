import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill IndexedDB for JSDOM environment
import 'fake-indexeddb/auto';

// 1. Mock matchMedia (for Mantine color scheme)
Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// 2. Mock ResizeObserver (for Mantine layout)
// Must be a class, not an arrow function
globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* mock method */ }
    unobserve() { /* mock method */ }
    disconnect() { /* mock method */ }
};

// 3. Mock Web Worker (for useSimWorker)
// Must be a class
globalThis.Worker = class Worker {
    url: string;
    onmessage: (msg: unknown) => void;
    constructor(stringUrl: string) {
        this.url = stringUrl;
        this.onmessage = () => {};
    }
    postMessage(_msg: unknown) {
        // Echo back if needed, or just do nothing
    }
    terminate() { /* mock method */ }
    addEventListener() { /* mock method */ }
    removeEventListener() { /* mock method */ }
} as unknown as typeof Worker;
