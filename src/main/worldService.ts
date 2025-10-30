import { db } from './db';
import { ALL_SECTORS, type World, type City, type Sector } from './types';
import { deriveEquilibrium, chipsFor, competitionDiceFor } from './sim';

// Generate UUID v4
const uid = () => crypto.randomUUID();

// World operations
export async function createWorld(name: string): Promise<World> {
    const world: World = {
        id: uid(),
        name: name.trim() || 'Untitled World',
        createdAt: Date.now()
    };
    await db.worlds.add(world);
    return world;
}

export async function listWorlds(): Promise<World[]> {
    return db.worlds.orderBy('createdAt').reverse().toArray();
}

// City operations
export async function addCity(worldId: string, name: string): Promise<{ city: City; sectors: Sector[] }> {
    const city: City = {
        id: uid(),
        worldId,
        name: name.trim() || 'Untitled City',
        lastTick: Date.now()
    };

    // Initialize 10 sectors with random supply/demand around 50
    const sectors: Sector[] = ALL_SECTORS.map((type) => {
        const supply = 50 + Math.floor(Math.random() * 11) - 5; // 45-55 range
        const demand = 50 + Math.floor(Math.random() * 11) - 5; // 45-55 range
        const equilibrium = deriveEquilibrium(supply, demand);

        return {
            id: uid(),
            cityId: city.id,
            type,
            supply,
            demand,
            equilibrium,
            startingChips: chipsFor(equilibrium),
            competitionUndercutDice: competitionDiceFor(equilibrium),
            priceIndex: null, // user can set this later
            updatedAt: Date.now()
        };
    });

    // Save city and sectors in a transaction (all-or-nothing)
    await db.transaction('rw', db.cities, db.sectors, async () => {
        await db.cities.add(city);
        await db.sectors.bulkAdd(sectors);
    });

    return { city, sectors };
}

export async function listCities(worldId: string): Promise<City[]> {
    const cities = await db.cities.where({ worldId }).toArray();
    cities.sort((a, b) => a.name.localeCompare(b.name));
    return cities;
}


export async function getCitySectors(cityId: string): Promise<Sector[]> {
    const sectors = await db.sectors.where({ cityId }).toArray();
    // Sort alphabetically by sector type
    sectors.sort((a, b) => a.type.localeCompare(b.type));
    return sectors;
}

export async function updateSectorsInCity(cityId: string, updatedSectors: Sector[]): Promise<void> {
    // Save updated sectors and update city timestamp
    await db.transaction('rw', db.sectors, db.cities, async () => {
        await db.sectors.bulkPut(updatedSectors);
        await db.cities.update(cityId, { lastTick: Date.now() });
    });
}