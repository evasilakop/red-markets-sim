import {db} from './db.ts';
import {
    ALL_SECTORS,
    type City,
    type OperationResult,
    type Sector, type SectorType
} from '../common/types.ts';
import {chipsFor, competitionDiceFor, deriveEquilibrium} from './sim.ts';
import {MAX_SUPPLY, MIN_SUPPLY} from '../common/constants.ts';

import { generateId } from '../utils/idUtils.ts';

/**
 * Clamps a supply or demand value to the valid [0, 100] range.
 */
function clampSupplyDemand(value: number): number {
    const safe = Number.isFinite(value) ? value : 50;
    return Math.max(MIN_SUPPLY, Math.min(MAX_SUPPLY, safe));
}

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

export async function addCity(
    worldId: string, 
    cityInfo: Partial<City>, 
    customSectors?: Record<SectorType, { supply: number; demand: number }>
): Promise<{ city: City; sectors: Sector[] }> {
    const city: City = {
        id: uid(),
        worldId,
        name: (cityInfo.name || 'Untitled City').trim(),
        lastTick: Date.now(),
        notes: cityInfo.notes || null,
        population: cityInfo.population ?? 1000,
        techLevel: cityInfo.techLevel || 'Industrial',
        defense: cityInfo.defense ?? 10,
        exports: cityInfo.exports || [],
        imports: cityInfo.imports || []
    };

    // Initialize sectors
    const sectors: Sector[] = ALL_SECTORS.map((sectorType) => {
        let supply: number;
        let demand: number;

        // If customSectors is provided, we MUST use the provided value for EVERY sector.
        // If a specific sector is missing from customSectors, we fall back to random
        // but logically, if the mode is 'custom', the UI should provide all.
        if (customSectors && customSectors[sectorType]) {
            supply = clampSupplyDemand(customSectors[sectorType].supply);
            demand = clampSupplyDemand(customSectors[sectorType].demand);
        } else {
            // Default random values (45-55 range)
            supply = 50 + Math.floor(Math.random() * 11) - 5;
            demand = 50 + Math.floor(Math.random() * 11) - 5;
        }

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
