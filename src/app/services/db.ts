import Dexie, {type Table} from 'dexie';
import type {City, Sector, World} from '../common/types.ts';

export class RMDB extends Dexie {
    // Declare table properties
    worlds!: Table<World, string>;
    cities!: Table<City, string>;
    sectors!: Table<Sector, string>;

    constructor() {
        super('rm_worlds'); // Database name in IndexedDB

        this.version(2).stores({
            worlds: 'id, name, createdAt',
            cities: 'id, worldId, name, lastTick, population, techLevel, [imports], [exports]',
            sectors: 'id, cityId, type',
        }).upgrade(async (tx) => {
            // Clear all data to reset schema for new City fields
            await tx.table('worlds').clear();
            await tx.table('cities').clear();
            await tx.table('sectors').clear();
        });
    }
}

// Export single instance to use throughout the app
export const db = new RMDB();
(globalThis as { db?: RMDB }).db = db;
