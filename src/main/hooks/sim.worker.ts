/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse, Sector } from '../common/types.ts';
import { applyActionToSector, tickSector } from '../sim.ts';

// Handle messages from the main thread
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    try {
        const request = e.data;
        let result: Sector[];

        if (request.type === 'applyActions') {
            // Apply actions to sectors
            result = request.sectors.map(sector => {
                const actionsForSector = request.actions[sector.type] || [];
                return actionsForSector.reduce(
                    (updatedSector, action) => applyActionToSector(updatedSector, action),
                    sector
                );
            });
        } else if (request.type === 'tick') {
            // Apply tick to all sectors
            result = request.sectors.map(sector => tickSector(sector));
        } else {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Unknown request type: ${(request as any).type}`);
        }

        // Send success response
        const response: WorkerResponse = {
            type: 'result',
            sectors: result
        };
        self.postMessage(response);

    } catch (error) {
        // Send error response
        const errorResponse: WorkerResponse = {
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown worker error'
        };
        self.postMessage(errorResponse);
    }
};
