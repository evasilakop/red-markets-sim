import type {Sector, WorkerRequest, WorkerResponse} from '../../common/types.ts';
import {applyActionToSector, tickSector} from '../sim.ts';

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    // Get id here so it is available for catch if needed.
    const { id } = e.data;

    try {
        const request = e.data;
        let resultSectors: Sector[];

        if (request.type === 'applyActions') {
            resultSectors = request.sectors.map(sector => {
                const actionsForSector = request.actions[sector.type] || [];
                return actionsForSector.reduce(
                    (updatedSector, action) => applyActionToSector(updatedSector, action),
                    sector
                );
            });
        } else if (request.type === 'tick') {
            resultSectors = request.sectors.map(sector => tickSector(sector));
        } else {
            // TypeScript knows this branch is impossible if types cover all cases,
            // but good for runtime safety
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Unknown request type`);
        }

        const response: WorkerResponse = {
            id,
            type: 'result',
            sectors: resultSectors
        };
        self.postMessage(response);

    } catch (error) {
        const errorResponse: WorkerResponse = {
            id,
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown worker error'
        };
        self.postMessage(errorResponse);
    }
};