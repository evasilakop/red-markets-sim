import Dexie, {type Table} from 'dexie';
import {type City, type Sector, type World} from '../common/types.ts';

export class RMDB extends Dexie {
    // Declare table properties
    worlds!: Table<World, string>;
    cities!: Table<City, string>;
    sectors!: Table<Sector, string>;

    constructor() {
        super('rm_worlds'); // Database name in IndexedDB

        // Define schema version 1
        this.version(1).stores({
            worlds: 'id, name, createdAt',           // id = primary key, others are indexes
            cities: 'id, worldId, name, lastTick',   // worldId index for "get all cities in world"
            sectors: 'id, cityId, type',             // cityId index for "get all sectors in city"
        });
    }
}

// Export single instance to use throughout the app
export const db = new RMDB();
(window as any).db = db;