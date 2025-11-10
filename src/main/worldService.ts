import { db } from './db';
import { ALL_SECTORS, type World, type City, type Sector, type OperationResult } from './types';
import { deriveEquilibrium, chipsFor, competitionDiceFor } from './sim';

interface WorldBundle {
    version: number;
    world: World;
    cities: City[];
    sectors: Sector[];
    exportedAt: number;
}

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

    // Save city and sectors in a transaction (either both succeed or both fail)
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

export async function exportWorld(worldId: string): Promise<OperationResult> {
    try {
        // Get the world
        const world = await db.worlds.get(worldId);
        if (!world) {
            return {
                success: false,
                error: `World not found.`
            };
        }

        // Get all cities in the world
        const cities = await db.cities.where({ worldId }).toArray();

        // Get all sectors for all cities in the world
        const cityIds = cities.map(city => city.id);
        const sectors = await db.sectors.where('cityId').anyOf(cityIds).toArray();

        // Create the bundle
        const bundle: WorldBundle = {
            version: 1,
            world,
            cities,
            sectors,
            exportedAt: Date.now()
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(bundle, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link and click it
        const link = document.createElement('a');
        link.href = url;
        link.download = `${world.name.replace(/[^a-zA-Z0-9]/g, '_')}.rmworld.json`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return {
            success: true,
            message: `World "${world.name}" exported successfully.`
        };

    } catch (error) {
        console.error('Export failed:', error);
        return {
            success: false,
            error: `Failed to export world: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function importWorld(file: File): Promise<{ success: boolean; worldName: string; error?: string }> {
    try {
        // Read the file
        const fileText = await file.text();

        // Parse JSON
        let bundle: WorldBundle;
        try {
            bundle = JSON.parse(fileText);
        } catch (parseError) {
            return {
                success: false,
                worldName: '',
                error: 'Invalid JSON file. Please select a valid .rmworld.json file.'
            };
        }

        // Validate bundle structure
        const validationError = validateWorldBundle(bundle);
        if (validationError) {
            return {
                success: false,
                worldName: bundle.world?.name || 'Unknown',
                error: validationError
            };
        }

        // Check version compatibility
        if (bundle.version > 1) {
            return {
                success: false,
                worldName: bundle.world.name,
                error: 'This world file is from a newer version. Please update the app.'
            };
        }

        // Check if world already exists
        const existingWorld = await db.worlds.get(bundle.world.id);
        if (existingWorld) {
            // For now, we'll overwrite. Later you can add user confirmation here.
            console.log(`Overwriting existing world: ${existingWorld.name}`);
        }

        // Import in a transaction (all or nothing)
        await db.transaction('rw', db.worlds, db.cities, db.sectors, async () => {
            // Import world
            await db.worlds.put(bundle.world);

            // Import cities
            if (bundle.cities.length > 0) {
                await db.cities.bulkPut(bundle.cities);
            }

            // Import sectors
            if (bundle.sectors.length > 0) {
                await db.sectors.bulkPut(bundle.sectors);
            }
        });

        return {
            success: true,
            worldName: bundle.world.name
        };

    } catch (error) {
        console.error('Import failed:', error);
        return {
            success: false,
            worldName: '',
            error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

// Helper function to validate the bundle structure
function validateWorldBundle(bundle: any): string | null {
    // Check if bundle has required top-level properties
    if (!bundle || typeof bundle !== 'object') {
        return 'Invalid file format.';
    }

    if (typeof bundle.version !== 'number') {
        return 'Missing or invalid version field.';
    }

    if (!bundle.world || typeof bundle.world !== 'object') {
        return 'Missing or invalid world data.';
    }

    if (!Array.isArray(bundle.cities)) {
        return 'Missing or invalid cities data.';
    }

    if (!Array.isArray(bundle.sectors)) {
        return 'Missing or invalid sectors data.';
    }

    // Validate world object
    const world = bundle.world;
    if (!world.id || !world.name || typeof world.createdAt !== 'number') {
        return 'Invalid world data structure.';
    }

    // Validate cities have required fields
    for (const city of bundle.cities) {
        if (!city.id || !city.worldId || !city.name || typeof city.lastTick !== 'number') {
            return 'Invalid city data structure.';
        }
        if (city.worldId !== world.id) {
            return 'City data does not match world ID.';
        }
    }

    // Validate sectors have required fields
    const cityIds = bundle.cities.map((c: City) => c.id);
    for (const sector of bundle.sectors) {
        if (!sector.id || !sector.cityId || !sector.type ||
            typeof sector.supply !== 'number' || typeof sector.demand !== 'number') {
            return 'Invalid sector data structure.';
        }
        if (!cityIds.includes(sector.cityId)) {
            return 'Sector data references non-existent city.';
        }
        // Validate supply/demand ranges
        if (sector.supply < 0 || sector.supply > 100 || sector.demand < 0 || sector.demand > 100) {
            return 'Invalid sector supply/demand values (must be 0-100).';
        }
    }

    return null; // No errors
}

// Delete children first, then parents
export async function deleteWorld(worldId: string): Promise<OperationResult> {
    try {
        // Get world name before deleting (for success message)
        const world = await db.worlds.get(worldId);
        if (!world) {
            return {
                success: false,
                error: 'World not found. It may have already been deleted.'
            };
        }

        const worldName = world.name;

        // Get all cities in the world first (need their IDs for sectors)
        const cities = await db.cities.where({ worldId }).toArray();

        // Delete everything in a transaction (all or nothing)
        await db.transaction('rw', db.sectors, db.cities, db.worlds, async () => {
            // Delete all sectors in all cities of this world
            if (cities.length > 0) {
                const cityIds = cities.map(city => city.id);
                await db.sectors.where('cityId').anyOf(cityIds).delete();
            }

            // Delete all cities in the world
            await db.cities.where({ worldId }).delete();

            // Delete the world itself
            await db.worlds.delete(worldId);
        });

        return {
            success: true,
            message: `World "${worldName}" deleted successfully`
        };

    } catch (error) {
        console.error('Delete world failed:', error);
        return {
            success: false,
            error: `Failed to delete world: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}