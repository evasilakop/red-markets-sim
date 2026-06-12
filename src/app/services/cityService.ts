import {db} from './db.ts';
import {
    ALL_SECTORS,
    type City,
    type OperationResult,
    type Sector
} from '../common/types.ts';
import {chipsFor, competitionDiceFor, deriveEquilibrium} from './sim.ts';

import { generateId } from '../utils/idUtils.ts';

// Generate UUID v4
const uid = generateId;


/**
 * Fetches a city and all its associated sectors.
 * Used by hooks and components to avoid direct db access.
 */
export async function getCityData(cityId: string): Promise<{ city: City | undefined; sectors: Sector[] }> {
    const city = await db.cities.get(cityId);
    const sectors = await getCitySectors(cityId);
    return { city, sectors };
}

export async function addCity(worldId: string, name: string): Promise<{ city: City; sectors: Sector[] }> {
    const city: City = {
        id: uid(),
        worldId,
        name: name.trim() || 'Untitled City',
        lastTick: Date.now(),
        notes: null,
        population: 1000,
        techLevel: 'Industrial',
        defense: 10,
        exports: [],
        imports: []
    };

    // Initialize 10 sectors with random supply/demand around 50
    const sectors: Sector[] = ALL_SECTORS.map((sectorType) => {
        const supply = 50 + Math.floor(Math.random() * 11) - 5; // 45-55 range
        const demand = 50 + Math.floor(Math.random() * 11) - 5; // 45-55 range
        const equilibrium = deriveEquilibrium(supply, demand);

        return {
            id: uid(),
            cityId: city.id,
            type: sectorType,
            supply,
            demand,
            equilibrium,
            startingChips: chipsFor(equilibrium),
            competitionUndercutDice: competitionDiceFor(equilibrium),
            priceIndex: null, // user can set this later
            updatedAt: Date.now()
        };
    });

    // Save city and sectors in a transaction (either both succeed or both fail)
    await db.transaction('rw', db.cities, db.sectors, async () => {
        await db.cities.add(city);
        await db.sectors.bulkAdd(sectors);
    });

    return { city, sectors };
}

export async function listCities(worldId: string): Promise<City[]> {
    const cities = await db.cities.where({ worldId }).toArray();
    cities.sort((a, b) => a.name.localeCompare(b.name)); //sort alphabetically
    return cities;
}

export async function removeCity(cityId: string): Promise<OperationResult> {
    const city = await db.cities.get(cityId);
    if (!city) {
        return {
            success: false,
            error: 'City not found',
        };
    }

    const cityName = city.name;

    // Delete everything in a transaction (sectors first, then city)
    await db.transaction('rw', db.sectors, db.cities, async () => {
        // Delete all sectors in this city
        await db.sectors.where({ cityId }).delete();

        // Delete the city itself
        await db.cities.delete(cityId);
    });

    return {
        success: true,
        message: `City "${cityName}" deleted successfully`
    };
}

export async function getCitySectors(cityId: string): Promise<Sector[]> {
    const sectors = await db.sectors.where({ cityId }).toArray();
    // Sort alphabetically by sector type
    sectors.sort((a, b) => a.type.localeCompare(b.type));
    return sectors;
}

export async function updateCityTick(cityId: string): Promise<void> {
    await db.cities.update(cityId, { lastTick: Date.now() });
}

export async function updateSectorsInCity(cityId: string, updatedSectors: Sector[]): Promise<void> {
    // Save updated sectors and update city timestamp
    await db.transaction('rw', db.sectors, db.cities, async () => {
        await db.sectors.bulkPut(updatedSectors);
        await db.cities.update(cityId, { lastTick: Date.now() });
    });
}

/**
 * Updates city basic info.
 */
export async function updateCity(cityId: string, updates: Partial<City>): Promise<void> {
    await db.cities.update(cityId, updates);
}

/**
 * Deletes all cities and their associated sectors for a given world.
 * Used by worldService.deleteWorld for cascading deletion.
 */
export async function removeAllCitiesInWorld(worldId: string): Promise<void> {
    const cities = await db.cities.where({ worldId }).toArray();
    if (cities.length > 0) {
        const cityIds = cities.map(city => city.id);
        await db.transaction('rw', db.sectors, db.cities, async () => {
            await db.sectors.where('cityId').anyOf(cityIds).delete();
            await db.cities.where({ worldId }).delete();
        });
    }
}
