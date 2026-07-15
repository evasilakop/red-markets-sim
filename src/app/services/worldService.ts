import {db} from './db.ts';
import {
    type OperationResult,
    type World
} from '../common/types.ts';
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
