import {useEffect, useMemo, useRef, useState} from 'react';
import type {Sector, SectorType, UserAction, WorkerRequest, WorkerResponse} from './common/types.ts';

export function useSimWorker() {
    const workerRef = useRef<Worker | null>(null);
    const [busy, setBusy] = useState(false);

    // Create worker on mount, cleanup on unmount
    useEffect(() => {
        const worker = new Worker(
            new URL('./sim.worker.ts', import.meta.url),
            { type: 'module' }
        );
        workerRef.current = worker;

        return () => {
            worker.terminate();
        };
    }, []);

    // Generic function to send messages to worker and get responses
    const sendToWorker = useMemo(() => {
        return <T extends WorkerRequest>(request: T): Promise<Sector[]> => {
            return new Promise((resolve, reject) => {
                const worker = workerRef.current;
                if (!worker) {
                    reject(new Error('Worker not initialized'));
                    return;
                }

                // Set up response handler
                const handleResponse = (e: MessageEvent<WorkerResponse>) => {
                    worker.removeEventListener('message', handleResponse);

                    if (e.data.type === 'result') {
                        resolve(e.data.sectors);
                    } else if (e.data.type === 'error') {
                        reject(new Error(e.data.message));
                    }
                };

                // Set up timeout
                const timeoutId = setTimeout(() => {
                    worker.removeEventListener('message', handleResponse);
                    reject(new Error('Worker timeout'));
                }, 10000); // 10 second timeout

                worker.addEventListener('message', handleResponse);

                // Clear timeout when we get a response
                worker.addEventListener('message', () => clearTimeout(timeoutId), { once: true });

                // Send the request
                worker.postMessage(request);
            });
        };
    }, []);

    // Apply actions to sectors
    const applyActions = async (sectors: Sector[], actions: Record<SectorType, UserAction[]>): Promise<Sector[]> => {
        setBusy(true);
        try {
            return await sendToWorker({
                type: 'applyActions',
                sectors,
                actions
            });
        } finally {
            setBusy(false);
        }
    };

    // Tick all sectors
    const tick = async (sectors: Sector[]): Promise<Sector[]> => {
        setBusy(true);
        try {
            const result = await sendToWorker({
                type: 'tick',
                sectors
            });
            return result;
        } finally {
            setBusy(false);
        }
    };

    return {
        busy,
        applyActions,
        tick
    };
}
