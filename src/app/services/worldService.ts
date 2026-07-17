import {db} from './db.ts';
import {
    type OperationResult,
    type Sector,
    type World
} from '../common/types.ts';
import {CURRENT_BUNDLE_VERSION} from '../common/constants.ts';
import {validateWorldBundle, type WorldBundle, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES} from './validation.ts';
import { removeAllCitiesInWorld } from './cityService.ts';

import { generateId } from '../utils/idUtils.ts';

// Generate UUID v4
const uid = generateId;


// World operations
export async function createWorld(name: string): Promise<World> {
    const world: World = {
        id: uid(),
        name: name.trim() || 'Untitled World',
        turn: 0,
        createdAt: Date.now()
    };
    await db.worlds.add(world);
    return world;
}

export async function listWorlds(): Promise<World[]> {
    return db.worlds.orderBy('createdAt').reverse().toArray();
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
            version: CURRENT_BUNDLE_VERSION,
            world: world,
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
        link.remove();
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
        // File-level validation — reject early before any I/O
        if (file.size > MAX_FILE_SIZE) {
            return {
                success: false,
                worldName: '',
                error: `File too large (max ${MAX_FILE_SIZE} bytes).`,
            };
        }

        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
            return {
                success: false,
                worldName: '',
                error: 'Unsupported file type. Please select a valid .rmworld.json file.',
            };
        }

        // Read the file
        const fileText = await file.text();

        // Parse JSON
        let bundle: WorldBundle;
        try {
            bundle = JSON.parse(fileText);
        } catch (parseError) {
            console.error(parseError);
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
        if (bundle.version > CURRENT_BUNDLE_VERSION) {
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

        // Default turn to 0 for backward compat with older exports
        const worldWithTurn = {...bundle.world, turn: bundle.world.turn ?? 0};

        // Import in a transaction (all or nothing)
        await db.transaction('rw', db.worlds, db.cities, db.sectors, async () => {
            // Import world
            await db.worlds.put(worldWithTurn);

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

        // Delete everything in a transaction (all or nothing)
        await db.transaction('rw', db.sectors, db.cities, db.worlds, async () => {
            // Delegate city and sector deletion to cityService
            await removeAllCitiesInWorld(worldId);
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

/**
 * Result summary returned after a successful world-wide tick.
 */
export interface TickWorldResult {
    /** The new turn number after incrementing. */
    turn: number;
    /** Count of sectors whose equilibrium changed during this tick. */
    changedSectors: number;
}

/**
 * Advances the entire world by one turn.
 *
 * 1. Loads all cities and sectors for the given world.
 * 2. Sends ALL sectors through the provided tick function (worker).
 * 3. Updates each city's lastTick timestamp.
 * 4. Increments World.turn by 1.
 *
 * All database writes are wrapped in a single transaction for atomicity.
 *
 * @param worldId - The world to advance.
 * @param tickFn - The worker tick function: `(sectors: Sector[]) => Promise<Sector[]>`.
 * @returns A result object with either a success summary or an error.
 */
export async function tickWorld(
    worldId: string,
    tickFn: (sectors: Sector[]) => Promise<Sector[]>
): Promise<{success: true, result: TickWorldResult} | {success: false, error: string}> {
    // 1. Load the world
    const world = await db.worlds.get(worldId);
    if (!world) {
        return { success: false, error: 'World not found.' };
    }

    // 2. Load all cities in the world
    const cities = await db.cities.where({ worldId }).toArray();

    // 3. Load all sectors for all cities
    const cityIds = cities.map((c) => c.id);
    const oldSectors = await db.sectors.where('cityId').anyOf(cityIds).toArray();

    // 4. Send all sectors through the worker tick function as one batch
    const newSectors = await tickFn(oldSectors);

    // 5. Count sectors whose equilibrium changed
    const changedSectors = newSectors.filter(
        (ns, i) => ns.equilibrium !== oldSectors[i].equilibrium
    ).length;

    // 6. Persist everything in a single transaction
    const now = Date.now();
    const newTurn = world.turn + 1;

    await db.transaction('rw', db.sectors, db.cities, db.worlds, async () => {
        // Update sectors
        await db.sectors.bulkPut(newSectors);

        // Update each city's lastTick
        for (const city of cities) {
            await db.cities.update(city.id, { lastTick: now });
        }

        // Increment world turn
        await db.worlds.update(worldId, { turn: newTurn });
    });

    return { success: true, result: { turn: newTurn, changedSectors } };
}
