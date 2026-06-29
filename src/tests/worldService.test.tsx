import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createTestDb } from './test-utils';
import * as worldService from '../app/services/worldService';
import * as cityService from '../app/services/cityService';

import 'fake-indexeddb/auto';

const { mockDbContainer } = vi.hoisted(() => ({
    mockDbContainer: {
        db: null as any
    }
}));

vi.mock('../app/services/db', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../app/services/db')>();
    return {
        ...actual,
        get db() {
            return mockDbContainer.db;
        }
    };
});

/** Creates a mock File object with a working text() method for JSDOM. */
function createFileFromJson(data: unknown): File {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], 'test.rmworld.json', { type: 'application/json' });
    // JSDOM File may not have text() — attach it from Blob prototype
    if (!file.text) {
        file.text = () => Promise.resolve(json);
    }
    return file;
}

describe('worldService - import/export', () => {
    let testDb: any;
    let testWorldId: string;

    beforeAll(async () => {
        testDb = createTestDb();
        mockDbContainer.db = testDb;
        const world = await worldService.createWorld('Export Test World');
        testWorldId = world.id;
        await cityService.addCity(testWorldId, {
            name: 'Test City',
            population: 5000,
            techLevel: 'Digital',
            defense: 75,
            exports: ['Food', 'Water'],
            imports: ['Fuel']
        });
    });

    afterAll(async () => {
        if (testDb) await testDb.close();
        vi.restoreAllMocks();
    });

    it('should export a world and produce a valid bundle with all city fields', async () => {
        const result = await worldService.exportWorld(testWorldId);
        expect(result.success).toBe(true);

        // Verify the DB contains the expected city fields
        const cities = await testDb.cities.where({ worldId: testWorldId }).toArray();
        expect(cities).toHaveLength(1);
        expect(cities[0].population).toBe(5000);
        expect(cities[0].techLevel).toBe('Digital');
        expect(cities[0].defense).toBe(75);
        expect(cities[0].exports).toEqual(['Food', 'Water']);
        expect(cities[0].imports).toEqual(['Fuel']);
    });

    it('should import a valid bundle and restore all fields correctly', async () => {
        const bundle = {
            version: 1,
            world: { id: 'imported-world', name: 'Imported World', createdAt: Date.now() },
            cities: [{
                id: 'imported-city-1',
                worldId: 'imported-world',
                name: 'Imported City',
                lastTick: Date.now(),
                population: 2500,
                techLevel: 'Cutting Edge',
                defense: 80,
                exports: ['High Tech', 'Data'],
                imports: ['Food', 'Fuel']
            }],
            sectors: [],
            exportedAt: Date.now()
        };

        const file = createFileFromJson(bundle);
        const result = await worldService.importWorld(file);

        expect(result.success).toBe(true);
        expect(result.worldName).toBe('Imported World');

        // Verify data was written to DB
        const city = await testDb.cities.get('imported-city-1');
        expect(city).toBeDefined();
        expect(city.population).toBe(2500);
        expect(city.techLevel).toBe('Cutting Edge');
        expect(city.defense).toBe(80);
        expect(city.exports).toEqual(['High Tech', 'Data']);
        expect(city.imports).toEqual(['Food', 'Fuel']);
    });

    it('should reject a bundle with missing population field', async () => {
        const bundle = {
            version: 1,
            world: { id: 'w-1', name: 'Bad World', createdAt: Date.now() },
            cities: [{
                id: 'c-1',
                worldId: 'w-1',
                name: 'Bad City',
                lastTick: Date.now(),
            }],
            sectors: [],
            exportedAt: Date.now()
        };

        const file = createFileFromJson(bundle);
        const result = await worldService.importWorld(file);

        expect(result.success).toBe(false);
        expect(result.error).toContain('population');
    });

    it('should reject a bundle with invalid techLevel', async () => {
        const bundle = {
            version: 1,
            world: { id: 'w-2', name: 'Bad Tech World', createdAt: Date.now() },
            cities: [{
                id: 'c-2',
                worldId: 'w-2',
                name: 'Bad Tech City',
                lastTick: Date.now(),
                population: 1000,
                techLevel: 'InvalidTech',
                defense: 10,
                exports: [],
                imports: []
            }],
            sectors: [],
            exportedAt: Date.now()
        };

        const file = createFileFromJson(bundle);
        const result = await worldService.importWorld(file);

        expect(result.success).toBe(false);
        expect(result.error).toContain('techLevel');
    });

    it('should reject a bundle with missing defense field', async () => {
        const bundle = {
            version: 1,
            world: { id: 'w-3', name: 'No Defense', createdAt: Date.now() },
            cities: [{
                id: 'c-3',
                worldId: 'w-3',
                name: 'No Defense City',
                lastTick: Date.now(),
                population: 1000,
                techLevel: 'Industrial',
                exports: [],
                imports: []
            }],
            sectors: [],
            exportedAt: Date.now()
        };

        const file = createFileFromJson(bundle);
        const result = await worldService.importWorld(file);

        expect(result.success).toBe(false);
        expect(result.error).toContain('defense');
    });

    it('should reject a bundle with missing exports', async () => {
        const bundle = {
            version: 1,
            world: { id: 'w-4', name: 'No Exports', createdAt: Date.now() },
            cities: [{
                id: 'c-4',
                worldId: 'w-4',
                name: 'No Exports City',
                lastTick: Date.now(),
                population: 1000,
                techLevel: 'Industrial',
                defense: 10,
                imports: []
            }],
            sectors: [],
            exportedAt: Date.now()
        };

        const file = createFileFromJson(bundle);
        const result = await worldService.importWorld(file);

        expect(result.success).toBe(false);
        expect(result.error).toContain('exports');
    });
});
