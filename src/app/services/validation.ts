import type {City, Sector, TechLevel, World} from '../common/types.ts';
import { TECH_LEVELS } from '../common/constants.ts';

/**
 * Structure of a world bundle file used for import/export operations.
 * Contains all data needed to recreate a world with its cities and sectors.
 */
export interface WorldBundle {
    /** File format version for compatibility checking */
    version: number;
    /** The world data */
    world: World;
    /** All cities belonging to this world */
    cities: City[];
    /** All sectors belonging to cities in this world */
    sectors: Sector[];
    /** Timestamp when the bundle was exported */
    exportedAt: number;
}

/** Maximum allowed file size for imports (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** MIME types accepted for world import files */
export const SUPPORTED_FILE_TYPES = ['application/json', 'text/plain'];

/**
 * Validates the version field of a world bundle.
 *
 * @param version - The version value to validate
 * @returns Error message string if validation fails, null if valid
 */
function validateVersion(version: unknown): string | null {
    if (typeof version !== 'number') {
        return 'Missing or invalid version field.';
    }
    return null;
}

/**
 * Validates the world data object in a world bundle.
 *
 * @param world - The world object to validate
 * @returns Error message string if validation fails, null if valid
 */
function validateWorldData(world: unknown): string | null {
    if (!world || typeof world !== 'object') {
        return 'Missing or invalid world data.';
    }

    const w = world as Record<string, unknown>;
    if (!w.id || !w.name || typeof w.createdAt !== 'number') {
        return 'Invalid world data structure.';
    }
    // turn is optional for backward compatibility with older exports
    if (w.turn !== undefined && typeof w.turn !== 'number') {
        return 'Invalid world turn value.';
    }

    return null;
}

/**
 * Validates the cities array in a world bundle.
 *
 * @param cities - The cities array to validate
 * @param worldId - The world ID that all cities must reference
 * @returns Error message string if validation fails, null if valid
 */
function validateCities(cities: unknown[], worldId: string): string | null {
    for (const city of cities as Array<Record<string, unknown>>) {
        // Core identity fields
        if (!city.id || !city.worldId || !city.name || typeof city.lastTick !== 'number') {
            return 'Invalid city data structure.';
        }
        // Population
        if (typeof city.population !== 'number') {
            return 'Missing or invalid city field: population.';
        }
        // Tech level
        if (!TECH_LEVELS.includes(city.techLevel as TechLevel)) {
            return 'Missing or invalid city field: techLevel.';
        }
        // Defense
        if (typeof city.defense !== 'number') {
            return 'Missing or invalid city field: defense.';
        }
        // Trade arrays
        if (!Array.isArray(city.exports)) {
            return 'Missing or invalid city field: exports.';
        }
        if (!Array.isArray(city.imports)) {
            return 'Missing or invalid city field: imports.';
        }
        // Ensure city belongs to this world
        if (city.worldId !== worldId) {
            return 'City data does not match world ID.';
        }
    }

    return null;
}

/**
 * Validates the sectors array in a world bundle.
 *
 * @param sectors - The sectors array to validate
 * @param cities - The cities array used to verify city references
 * @returns Error message string if validation fails, null if valid
 */
function validateSectors(sectors: unknown[], cities: unknown[]): string | null {
    const cityIds = new Set((cities as Array<Record<string, unknown>>).map((c) => c.id as string));

    for (const sector of sectors as Array<Record<string, unknown>>) {
        // Check required fields
        if (!sector.id || !sector.cityId || !sector.type ||
            typeof sector.supply !== 'number' || typeof sector.demand !== 'number') {
            return 'Invalid sector data structure.';
        }

        // Ensure sector belongs to a city in this world
        if (!cityIds.has(sector.cityId as string)) {
            return 'Sector data references non-existent city.';
        }

        // Validate business rules (supply/demand must be 0-100)
        if (sector.supply < 0 || sector.supply > 100 || sector.demand < 0 || sector.demand > 100) {
            return 'Invalid sector supply/demand values (must be 0-100).';
        }
    }

    return null;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Validates the structure and content of a world bundle for import.
 * Delegates to focused sub-validators for version, world data, cities, and sectors.
 *
 * @param bundle - The parsed JSON object to validate
 * @returns Error message string if validation fails, null if valid
 */
export function validateWorldBundle(bundle: unknown): string | null {
    // Check basic structure
    if (!bundle || typeof bundle !== 'object') {
        return 'Invalid file format.';
    }

    const b = bundle as Record<string, unknown>;

    // Validate version
    const versionError = validateVersion(b.version);
    if (versionError) return versionError;

    // Validate world data
    const worldError = validateWorldData(b.world);
    if (worldError) return worldError;

    // Validate arrays exist
    if (!Array.isArray(b.cities)) {
        return 'Missing or invalid cities data.';
    }
    if (!Array.isArray(b.sectors)) {
        return 'Missing or invalid sectors data.';
    }

    // Validate cities against world ID
    const worldId = (b.world as Record<string, unknown>).id as string;
    const cityError = validateCities(b.cities, worldId);
    if (cityError) return cityError;

    // Validate sectors against city references
    const sectorError = validateSectors(b.sectors, b.cities);
    if (sectorError) return sectorError;

    return null;
}
