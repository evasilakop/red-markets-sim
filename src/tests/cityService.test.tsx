import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createTestDb } from './test-utils';
import * as cityService from '../app/services/cityService';
import { mockWorld, mockCities } from './fixtures';
import type { City } from '../app/common/types';

// Polyfill IndexedDB for JSDOM environment
import 'fake-indexeddb/auto';

// Mock the db module
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

describe('cityService', () => {
    let testDb: any;

    beforeAll(async () => {
        testDb = createTestDb();
        mockDbContainer.db = testDb;
        await testDb.worlds.add(mockWorld);
        await testDb.cities.bulkAdd(mockCities);
    });

    afterAll(async () => {
        if (testDb) await testDb.close();
        vi.restoreAllMocks();
    });

    describe('updateCity', () => {
        it('should update city name', async () => {
            const updatedName = 'Updated City Name';
            await cityService.updateCity('city-1', { name: updatedName });

            const result = await testDb.cities.get('city-1');
            expect(result.name).toBe(updatedName);
        });

        it('should update city population', async () => {
            const updatedPopulation = 5000;
            await cityService.updateCity('city-1', { population: updatedPopulation });

            const result = await testDb.cities.get('city-1');
            expect(result.population).toBe(updatedPopulation);
        });

        it('should update city techLevel', async () => {
            const updatedTechLevel = 'Digital' as const;
            await cityService.updateCity('city-1', { techLevel: updatedTechLevel });

            const result = await testDb.cities.get('city-1');
            expect(result.techLevel).toBe(updatedTechLevel);
        });

        it('should update city defense', async () => {
            const updatedDefense = 75;
            await cityService.updateCity('city-1', { defense: updatedDefense });

            const result = await testDb.cities.get('city-1');
            expect(result.defense).toBe(updatedDefense);
        });

        it('should update city notes', async () => {
            const updatedNotes = 'Updated city notes';
            await cityService.updateCity('city-1', { notes: updatedNotes });

            const result = await testDb.cities.get('city-1');
            expect(result.notes).toBe(updatedNotes);
        });

        it('should update city exports', async () => {
            const updatedExports = ['Food', 'Water', 'Steel'];
            await cityService.updateCity('city-1', { exports: updatedExports });

            const result = await testDb.cities.get('city-1');
            expect(result.exports).toEqual(updatedExports);
        });

        it('should update city imports', async () => {
            const updatedImports = ['Fuel', 'Medicine'];
            await cityService.updateCity('city-1', { imports: updatedImports });

            const result = await testDb.cities.get('city-1');
            expect(result.imports).toEqual(updatedImports);
        });

        it('should update multiple fields at once', async () => {
            const updates: Partial<City> = {
                name: 'Mega City',
                population: 10000,
                techLevel: 'Cutting Edge',
                defense: 90,
                notes: 'The best city',
                exports: ['Everything'],
                imports: ['Nothing']
            };

            await cityService.updateCity('city-1', updates);

            const result = await testDb.cities.get('city-1');
            expect(result.name).toBe('Mega City');
            expect(result.population).toBe(10000);
            expect(result.techLevel).toBe('Cutting Edge');
            expect(result.defense).toBe(90);
            expect(result.notes).toBe('The best city');
            expect(result.exports).toEqual(['Everything']);
            expect(result.imports).toEqual(['Nothing']);
        });

        it('should handle partial updates without affecting other fields', async () => {
            // First, reset city-1 to known state
            await testDb.cities.put({
                ...mockCities[0],
                name: 'City One',
                population: 1000,
                techLevel: 'Industrial',
                defense: 50,
                notes: null,
                exports: [],
                imports: []
            });

            // Update only the name
            await cityService.updateCity('city-1', { name: 'Partial Update' });

            const result = await testDb.cities.get('city-1');
            expect(result.name).toBe('Partial Update');
            expect(result.population).toBe(1000); // Should remain unchanged
            expect(result.techLevel).toBe('Industrial'); // Should remain unchanged
            expect(result.defense).toBe(50); // Should remain unchanged
        });

        it('should handle null notes', async () => {
            await cityService.updateCity('city-1', { notes: null });

            const result = await testDb.cities.get('city-1');
            expect(result.notes).toBeNull();
        });

        it('should handle empty arrays for exports and imports', async () => {
            await cityService.updateCity('city-1', { exports: [], imports: [] });

            const result = await testDb.cities.get('city-1');
            expect(result.exports).toEqual([]);
            expect(result.imports).toEqual([]);
        });
    });
});
