import {useEffect, useRef, useState, useCallback} from 'react';
import type {
    Sector,
    SectorType,
    UserAction,
    WorkerRequest,
    WorkerResponse,
    ApplyActionsMsg,
    TickMsg
} from '../common/types.ts';

/**
 * Interface for the return value of the useSimWorker hook.
 */
interface UseSimWorkerResult {
    /** Indicates if the worker is currently processing a request. */
    busy: boolean;
    /**
     * Sends a set of user actions to the worker for processing against specific sectors.
     * @param sectors - The current state of sectors to modify.
     * @param actions - A map of actions grouped by SectorType.
     * @returns A Promise resolving to the updated list of Sectors.
     */
    applyActions: (sectors: Sector[], actions: Record<SectorType, UserAction[]>) => Promise<Sector[]>;
    /**
     * Advances the simulation time by one tick for the provided sectors.
     * @param sectors - The current state of sectors to simulate.
     * @returns A Promise resolving to the updated list of Sectors.
     */
    tick: (sectors: Sector[]) => Promise<Sector[]>;
}

/**
 * A React hook that manages a dedicated Web Worker for simulation logic.
 *
 * This hook handles the lifecycle of the worker, manages concurrency via correlation IDs,
 * and provides typed methods to interact with the simulation layer asynchronously.
 *
 * @returns {UseSimWorkerResult} An object containing the busy state and methods to trigger simulation events.
 */
export function useSimWorker(): UseSimWorkerResult {
    const workerRef = useRef<Worker | null>(null);
    const [busy, setBusy] = useState(false);

    // Create worker on mount, cleanup on unmount
    useEffect(() => {
        const worker = new Worker(
            new URL('../services/workers/sim.worker.ts', import.meta.url),
            {type: 'module'}
        );
        workerRef.current = worker;

        return () => {
            worker.terminate();
        };
    }, []);

    /**
     * Internal helper to send typed messages to the worker and await a response.
     * Uses correlation IDs to ensure responses match their specific requests.
     *
     * @template T - The specific type of the request message (ApplyActionsMsg or TickMsg).
     * @param payload - The message payload (excluding the ID, which is generated internally).
     * @returns A Promise resolving to the updated sectors.
     */
    const postMessagePromise = useCallback(<T extends ApplyActionsMsg | TickMsg>(payload: T): Promise<Sector[]> => {
        return new Promise((resolve, reject) => {
            const worker = workerRef.current;
            if (!worker) return reject(new Error('Worker not initialized'));

            // Generate a unique ID to correlate request and response
            const id = crypto.randomUUID();

            const handleResponse = (e: MessageEvent<WorkerResponse>) => {
                // Ignore messages that don't match our current transaction ID
                if (e.data.id !== id) return;

                worker.removeEventListener('message', handleResponse);

                if (e.data.type === 'result') {
                    resolve(e.data.sectors);
                } else {
                    reject(new Error(e.data.message));
                }
            };

            worker.addEventListener('message', handleResponse);

            // Send the request with the ID attached
            worker.postMessage({...payload, id} as WorkerRequest);

            // Failsafe timeout to prevent hanging promises
            setTimeout(() => {
                worker.removeEventListener('message', handleResponse);
                reject(new Error('Worker timeout'));
            }, 10000);
        });
    }, []);

    const applyActions = useCallback(async (sectors: Sector[], actions: Record<SectorType, UserAction[]>) => {
        setBusy(true);
        try {
            return await postMessagePromise<ApplyActionsMsg>({
                type: 'applyActions',
                sectors,
                actions
            });
        } finally {
            setBusy(false);
        }
    }, [postMessagePromise]);

    const tick = useCallback(async (sectors: Sector[]) => {
        setBusy(true);
        try {
            return await postMessagePromise<TickMsg>({
                type: 'tick',
                sectors
            });
        } finally {
            setBusy(false);
        }
    }, [postMessagePromise]);

    return {
        busy,
        applyActions,
        tick
    };
}