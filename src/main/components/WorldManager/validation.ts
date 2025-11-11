import type { World, City, Sector } from '../../common/types';

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

// Constants
/** Maximum allowed file size for imports (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** MIME types accepted for world import files */
export const SUPPORTED_FILE_TYPES = ['application/json', 'text/plain'];

/**
 * Checks if the current browser supports all required APIs for file operations.
 *
 * @returns Object containing support status and list of missing features
 *
 */
export const checkBrowserSupport = (): { supported: boolean; missingFeatures: string[] } => {
    const missing: string[] = [];

    // Check for File API support (needed for file reading)
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        missing.push('File API');
    }

    // Check for JSON support (should be universal, but just in case)
    if (!window.JSON) {
        missing.push('JSON parsing');
    }

    // Check for URL.createObjectURL (needed for file downloads)
    if (!window.URL || !window.URL.createObjectURL) {
        missing.push('File downloads');
    }

    return {
        supported: missing.length === 0,
        missingFeatures: missing
    };
};

/**
 * Converts a file size in bytes to a human-readable string.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string like "1.5 MB" or "512 KB"
 *
 * @example
 * ```typescript
 * formatFileSize(1536) // "1.5 KB"
 * formatFileSize(0)    // "0 Bytes"
 * ```
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validates the structure and content of a world bundle for import.
 * Performs comprehensive validation including data types, relationships,
 * and business rule constraints.
 *
 * @param bundle - The parsed JSON object to validate
 * @returns Error message string if validation fails, null if valid
 *
 * @example
 * ```typescript
 * const bundle = JSON.parse(fileContent);
 * const error = validateWorldBundle(bundle);
 * if (error) {
 *   console.error('Invalid world file:', error);
 * } else {
 *   // Safe to import
 * }
 * ```
 */
export function validateWorldBundle(bundle: any): string | null {
    // Check basic structure
    if (!bundle || typeof bundle !== 'object') {
        return 'Invalid file format.';
    }

    // Validate version field
    if (typeof bundle.version !== 'number') {
        return 'Missing or invalid version field.';
    }

    // Validate world object exists
    if (!bundle.world || typeof bundle.world !== 'object') {
        return 'Missing or invalid world data.';
    }

    // Validate arrays exist
    if (!Array.isArray(bundle.cities)) {
        return 'Missing or invalid cities data.';
    }

    if (!Array.isArray(bundle.sectors)) {
        return 'Missing or invalid sectors data.';
    }

    // Validate world object structure
    const world = bundle.world;
    if (!world.id || !world.name || typeof world.createdAt !== 'number') {
        return 'Invalid world data structure.';
    }

    // Validate each city
    for (const city of bundle.cities) {
        if (!city.id || !city.worldId || !city.name || typeof city.lastTick !== 'number') {
            return 'Invalid city data structure.';
        }
        // Ensure city belongs to this world
        if (city.worldId !== world.id) {
            return 'City data does not match world ID.';
        }
    }

    // Validate each sector
    const cityIds = bundle.cities.map((c: City) => c.id);
    for (const sector of bundle.sectors) {
        // Check required fields
        if (!sector.id || !sector.cityId || !sector.type ||
            typeof sector.supply !== 'number' || typeof sector.demand !== 'number') {
            return 'Invalid sector data structure.';
        }

        // Ensure sector belongs to a city in this world
        if (!cityIds.includes(sector.cityId)) {
            return 'Sector data references non-existent city.';
        }

        // Validate business rules (supply/demand must be 0-100)
        if (sector.supply < 0 || sector.supply > 100 || sector.demand < 0 || sector.demand > 100) {
            return 'Invalid sector supply/demand values (must be 0-100).';
        }
    }

    return null; // All validation passed
}
