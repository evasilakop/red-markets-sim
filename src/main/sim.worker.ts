/// <reference lib="webworker" />
import { applyActionToSector, tickSector } from './sim';

self.onmessage = (e) => {
    console.log('Worker received:', e.data);

    if (e.data.type === 'test') {
        self.postMessage({ type: 'result', message: 'Worker is working!' });
    }
};
