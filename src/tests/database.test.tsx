import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, createTestDb } from './test-utils';
import { mockWorld, mockCities } from './fixtures';
import { useCityData } from '../app/hooks/useCityData';

// Polyfill IndexedDB for JSDOM environment
import 'fake-indexeddb/auto';

// 1. Use vi.hoisted to create a container for our mock DB.
const { mockDbContainer } = vi.hoisted(() => {
    return {
        mockDbContainer: {
            db: null as any
        }
    };
});

// 2. Mock the entire db module. 
vi.mock('../app/services/db', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../app/services/db')>();
    return {
        ...actual,
        get db() {
            return mockDbContainer.db;
        }
    };
});

// 3. Mock the hook module for UI tests
vi.mock('../app/hooks/useCityData', () => ({
    useCityData: vi.fn()
}));

describe('Database Service Tests', () => {
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

    it('should successfully persist and retrieve data from the in-memory mock', async () => {
        const newCity = {
            id: 'city-test',
            worldId: mockWorld.id,
            name: 'Test City',
            lastTick: Date.now(),
            population: 100,
            techLevel: 'Stone',
            defense: 10,
            exports: [],
            imports: []
        };

        await testDb.cities.add(newCity);
        const retrieved = await testDb.cities.get('city-test');
        
        expect(retrieved).toBeDefined();
        expect(retrieved.name).toBe('Test City');
    });
});

describe('Component UI Tests (with Hook Mocking)', () => {
    const TestComponent = () => {
        const data = useCityData('city-1');
        
        if (!data) return <div data-testid="loading">Loading...</div>;
        
        return (
            <div data-testid="container">
                <h1 data-testid="city-name">{data.city.name}</h1>
                <ul data-testid="sectors-list">
                    {data.sectors.map(s => <li key={s.id}>{s.type}</li>)}
                </ul>
            </div>
        );
    };

    it('should show loading state when data is undefined', () => {
        vi.mocked(useCityData).mockReturnValue(undefined);
        renderWithProviders(<TestComponent />);
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show city name when data is present', () => {
        vi.mocked(useCityData).mockReturnValue({
            city: { id: 'city-1', name: 'City One', worldId: 'world-1', lastTick: 0, population: 0, techLevel: 'Stone', defense: 0, exports: [], imports: [] },
            sectors: []
        });
        renderWithProviders(<TestComponent />);
        expect(screen.getByTestId('city-name')).toHaveTextContent('City One');
    });

    it('should show loading state when city is not found (null)', () => {
        vi.mocked(useCityData).mockReturnValue(null);
        renderWithProviders(<TestComponent />);
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
});
