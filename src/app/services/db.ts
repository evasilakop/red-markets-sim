import Dexie, {type Table} from 'dexie';
import type {City, Sector, World} from '../common/types.ts';

export class RMDB extends Dexie {
    // Declare table properties
    worlds!: Table<World, string>;
    cities!: Table<City, string>;
    sectors!: Table<Sector, string>;

    constructor() {
        super('rm_worlds'); // Database name in IndexedDB

        this.version(1).stores({
            worlds: 'id, name, createdAt',           // id = primary key, others are indexes
            cities: 'id, worldId, name, lastTick, population, techLevel, [imports], [exports]',   // worldId index for "get all cities in world"
            sectors: 'id, cityId, type',             // cityId index for "get all sectors in city"
        });
    }
}

// Export single instance to use throughout the app
export const db = new RMDB();
(globalThis as any).db = db;
