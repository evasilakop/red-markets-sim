import type { City, World } from '../../app/common/types';

export const mockWorld: World = {
    id: 'world-1',
    name: 'Test World',
    createdAt: Date.now(),
    notes: 'A test world'
};

export const mockCities: City[] = [
    {
        id: 'city-1',
        worldId: 'world-1',
        name: 'City One',
        lastTick: Date.now(),
        population: 1000,
        techLevel: 'Industrial',
        defense: 50,
        exports: [],
        imports: []
    },
    {
        id: 'city-2',
        worldId: 'world-1',
        name: 'City Two',
        lastTick: Date.now(),
        population: 500,
        techLevel: 'Stone',
        defense: 10,
        exports: [],
        imports: []
    }
];
