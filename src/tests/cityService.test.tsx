import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createTestDb } from './test-utils';
import * as cityService from '../app/services/cityService';
import { mockWorld, mockCities } from './fixtures';
import {type City, type SectorType} from '../app/common/types';
import { RMDB } from '../app/services/db';

// Polyfill IndexedDB for JSDOM environment
import 'fake-indexeddb/auto';

// Mock the db module
const { mockDbContainer } = vi.hoisted(() => ({
    mockDbContainer: {
        db: null as RMDB | null
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
    let testDb: RMDB;

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

    describe('generateRandomSectors', () => {
        it('should return values for all 10 sectors in the 45-55 range', () => {
            const sectors = cityService.generateRandomSectors();

            expect(Object.keys(sectors)).toHaveLength(10);
            Object.values(sectors).forEach(({ supply, demand }) => {
                expect(supply).toBeGreaterThanOrEqual(45);
                expect(supply).toBeLessThanOrEqual(55);
                expect(demand).toBeGreaterThanOrEqual(45);
                expect(demand).toBeLessThanOrEqual(55);
            });
        });
    });

    describe('addCity', () => {
        it('should create a city with random sectors when no custom sectors provided', async () => {
            const cityInfo = { name: 'Random City', population: 2000 };
            const { city, sectors } = await cityService.addCity(mockWorld.id, cityInfo);

            expect(city.name).toBe('Random City');
            expect(city.population).toBe(2000);
            expect(sectors).toHaveLength(10);
            
            // Check that sectors are in the 45-55 range (default logic)
            sectors.forEach(s => {
                expect(s.supply).toBeGreaterThanOrEqual(45);
                expect(s.supply).toBeLessThanOrEqual(55);
                expect(s.demand).toBeGreaterThanOrEqual(45);
                expect(s.demand).toBeLessThanOrEqual(55);
                expect(s.equilibrium).toBeDefined();
                expect(s.startingChips).toBeDefined();
            });
        });

        it('should create a city with specific custom sectors', async () => {
            const cityInfo = { name: 'Custom City' };
            // Set a specific sector to a known state (e.g. SCARCE)
            // Supply 10, Demand 90 -> SCARCE
            const customSectors: Record<SectorType, { supply: number; demand: number }> = {
                "FOOD & WATER": { supply: 10, demand: 90 },
                DATA: { supply: 50, demand: 50 },
                ENERGY: { supply: 50, demand: 50 },
                HR: { supply: 50, demand: 50 },
                MATERIAL: { supply: 50, demand: 50 },
                MEDICINE: { supply: 50, demand: 50 },
                PRODUCTS: { supply: 50, demand: 50 },
                SHELTER: { supply: 50, demand: 50 },
                SPECULATIVE: { supply: 50, demand: 50 },
                TRANSPORTATION: { supply: 50, demand: 50 }
            };

            const { city, sectors } = await cityService.addCity(mockWorld.id, cityInfo, customSectors);

            expect(city.name).toBe('Custom City');
            expect(sectors).toHaveLength(10);
            
            const foodSector = sectors.find(s => s.type === 'FOOD & WATER');
            expect(foodSector).toBeDefined();
            expect(foodSector?.supply).toBe(10);
            expect(foodSector?.demand).toBe(90);
            expect(foodSector?.equilibrium).toBe('SCARCE');
            expect(foodSector?.startingChips).toBeGreaterThan(0);

            // Verify that other sectors also used the custom values (50/50) and not random ones
            const otherSector = sectors.find(s => s.type !== 'FOOD & WATER');
            expect(otherSector?.supply).toBe(50);
            expect(otherSector?.demand).toBe(50);
        });

        it('should clamp custom sector values to 0-100 before saving', async () => {
            const customSectors: Record<SectorType, { supply: number; demand: number }> = {
                "FOOD & WATER": { supply: 150, demand: -10 },
                DATA: { supply: 50, demand: 50 },
                ENERGY: { supply: 50, demand: 50 },
                HR: { supply: 50, demand: 50 },
                MATERIAL: { supply: 50, demand: 50 },
                MEDICINE: { supply: 50, demand: 50 },
                PRODUCTS: { supply: 50, demand: 50 },
                SHELTER: { supply: 50, demand: 50 },
                SPECULATIVE: { supply: 50, demand: 50 },
                TRANSPORTATION: { supply: 50, demand: 50 },
            };

            const { sectors } = await cityService.addCity(mockWorld.id, { name: 'Clamped City' }, customSectors);

            const foodSector = sectors.find(s => s.type === 'FOOD & WATER');
            expect(foodSector?.supply).toBe(100);
            expect(foodSector?.demand).toBe(0);
        });


        it('should use defaults for missing cityInfo fields', async () => {
            const { city } = await cityService.addCity(mockWorld.id, { name: 'Default City' });
            expect(city.population).toBe(1000);
            expect(city.techLevel).toBe('Industrial');
            expect(city.defense).toBe(10);
        });
    });

    describe('updateCity', () => {
        it('should update city name', async () => {
            const updatedName = 'Updated City Name';
            await cityService.updateCity('city-1', { name: updatedName });

            const result = await testDb.cities.get('city-1');
            expect(result!.name).toBe(updatedName);
        });

        it('should update city population', async () => {
            const updatedPopulation = 5000;
            await cityService.updateCity('city-1', { population: updatedPopulation });

            const result = await testDb.cities.get('city-1');
            expect(result!.population).toBe(updatedPopulation);
        });

        it('should update city techLevel', async () => {
            const updatedTechLevel = 'Digital' as const;
            await cityService.updateCity('city-1', { techLevel: updatedTechLevel });

            const result = await testDb.cities.get('city-1');
            expect(result!.techLevel).toBe(updatedTechLevel);
        });

        it('should update city defense', async () => {
            const updatedDefense = 75;
            await cityService.updateCity('city-1', { defense: updatedDefense });

            const result = await testDb.cities.get('city-1');
            expect(result!.defense).toBe(updatedDefense);
        });

        it('should update city notes', async () => {
            const updatedNotes = 'Updated city notes';
            await cityService.updateCity('city-1', { notes: updatedNotes });

            const result = await testDb.cities.get('city-1');
            expect(result!.notes).toBe(updatedNotes);
        });

        it('should update city exports', async () => {
            const updatedExports = ['Food', 'Water', 'Steel'];
            await cityService.updateCity('city-1', { exports: updatedExports });

            const result = await testDb.cities.get('city-1');
            expect(result!.exports).toEqual(updatedExports);
        });

        it('should update city imports', async () => {
            const updatedImports = ['Fuel', 'Medicine'];
            await cityService.updateCity('city-1', { imports: updatedImports });

            const result = await testDb.cities.get('city-1');
            expect(result!.imports).toEqual(updatedImports);
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
            expect(result!.name).toBe('Mega City');
            expect(result!.population).toBe(10000);
            expect(result!.techLevel).toBe('Cutting Edge');
            expect(result!.defense).toBe(90);
            expect(result!.notes).toBe('The best city');
            expect(result!.exports).toEqual(['Everything']);
            expect(result!.imports).toEqual(['Nothing']);
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
            expect(result!.name).toBe('Partial Update');
            expect(result!.population).toBe(1000); // Should remain unchanged
            expect(result!.techLevel).toBe('Industrial'); // Should remain unchanged
            expect(result!.defense).toBe(50); // Should remain unchanged
        });

        it('should handle null notes', async () => {
            await cityService.updateCity('city-1', { notes: null });

            const result = await testDb.cities.get('city-1');
            expect(result!.notes).toBeNull();
        });

        it('should handle empty arrays for exports and imports', async () => {
            await cityService.updateCity('city-1', { exports: [], imports: [] });

            const result = await testDb.cities.get('city-1');
            expect(result!.exports).toEqual([]);
            expect(result!.imports).toEqual([]);
        });
    });
});
