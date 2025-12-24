import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CityDashboard from '../app/components/CityDashboard/CityDashboard';
import type { CityData } from '../app/hooks/useCityData';

// 1. Mock Hooks
const mockTick = vi.fn();
const mockApplyActions = vi.fn();

vi.mock('../../hooks/useSimWorker', () => ({
    useSimWorker: () => ({
        busy: false,
        tick: mockTick,
        applyActions: mockApplyActions
    })
}));

// 2. Mock city data
const mockUseCityData = vi.fn();
vi.mock('../../hooks/useCityData', () => ({
    useCityData: (id: string | null) => mockUseCityData(id)
}));

// 3. Mock DB
vi.mock('../../services/db', () => ({
    db: {
        transaction: vi.fn((_mode, _tables, callback) => callback()),
        sectors: { bulkPut: vi.fn() },
        cities: { update: vi.fn() }
    }
}));

describe('CityDashboard', () => {
    it('renders loading state when data is undefined', () => {
        mockUseCityData.mockReturnValue(undefined);
        render(<CityDashboard cityId="city-1" />);
        expect(screen.queryByText(/Loading market data/i)).not.toBeNull();
    });

    it('renders sector table when data is loaded', () => {
        const mockData: CityData = {
            city: { id: 'c1', worldId: 'w1', name: 'Test City', lastTick: Date.now() },
            sectors: [
                {
                    id: 's1', cityId: 'c1', type: 'FOOD & WATER',
                    supply: 50, demand: 50, equilibrium: 'VOLATILE',
                    startingChips: 0, competitionUndercutDice: 0, updatedAt: 0
                }
            ]
        };
        mockUseCityData.mockReturnValue(mockData);

        render(<CityDashboard cityId="c1" />);

        // Check for City Name
        expect(screen.getByText('Test City Market')).not.toBeNull();
        // Check for Sector Row
        expect(screen.getByText('FOOD & WATER')).not.toBeNull();
    });

    it('calls tick function when Advance Time is clicked', () => {
        const mockData: CityData = {
            city: { id: 'c1', worldId: 'w1', name: 'Test City', lastTick: Date.now() },
            sectors: []
        };
        mockUseCityData.mockReturnValue(mockData);
        mockTick.mockResolvedValue([]); // Worker returns empty array

        render(<CityDashboard cityId="c1" />);

        const tickBtn = screen.getByText(/Advance Time/i);
        fireEvent.click(tickBtn);

        expect(mockTick).toHaveBeenCalled();
    });
});