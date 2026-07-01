import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityDashboard from '../app/components/CityDashboard/CityDashboard';
import type { CityData } from '../app/hooks/useCityData';
import { MantineProvider } from '@mantine/core';

// 1. HOIST the mocks so they exist before vi.mock runs
const { mockUseCityData, mockTick, mockApplyActions } = vi.hoisted(() => ({
    mockUseCityData: vi.fn(),
    mockTick: vi.fn(),
    mockApplyActions: vi.fn()
}));

// 2. Mock Hooks using the hoisted variables
vi.mock('../app/hooks/useSimWorker', () => ({
    useSimWorker: () => ({
        busy: false,
        tick: mockTick,
        applyActions: mockApplyActions
    })
}));

vi.mock('../app/hooks/useCityData', () => ({
    useCityData: (id: string | null) => mockUseCityData(id)
}));

vi.mock('../app/services/db', () => ({
    db: {
        transaction: vi.fn(async (...args) => {
            const callback = args[args.length - 1]; // The last arg is the function
            return await callback();
        }),
        sectors: { bulkPut: vi.fn() },
        cities: { update: vi.fn() }
    }
}));

// Helper to wrap components in MantineProvider
const renderWithMantine = (ui: React.ReactNode) => {
    return render(
        <MantineProvider>
            {ui}
        </MantineProvider>
    );
};

describe('CityDashboard', () => {
    it('renders loading state when data is undefined', () => {
        mockUseCityData.mockReturnValue(undefined);

        // Use the wrapper
        renderWithMantine(<CityDashboard cityId="city-1" />);

        expect(screen.queryByText(/Loading market data/i)).not.toBeNull();
    });

    it('renders sector table when data is loaded', () => {
        const mockData: CityData = {
            city: { id: 'c1', worldId: 'w1', name: 'Test City', lastTick: Date.now(), techLevel: 'Iron', defense: 500, population: 1000, imports: [], exports: [] },
            sectors: [
                {
                    id: 's1', cityId: 'c1', type: 'FOOD & WATER',
                    supply: 50, demand: 50, equilibrium: 'VOLATILE',
                    startingChips: 0, competitionUndercutDice: 0, updatedAt: 0
                }
            ]
        };
        mockUseCityData.mockReturnValue(mockData);

        renderWithMantine(<CityDashboard cityId="c1" />);

        expect(screen.queryByText('Test City Market')).not.toBeNull();
        expect(screen.queryByText('FOOD & WATER')).not.toBeNull();
    });

    it('calls tick function when Advance Time is clicked', async () => {
        const mockData: CityData = {
            city: { id: 'c1', worldId: 'w1', name: 'Test City', lastTick: Date.now(), techLevel: 'Iron', defense: 500, population: 1000, imports: [], exports: [] },
            sectors: []
        };
        mockUseCityData.mockReturnValue(mockData);
        mockTick.mockResolvedValue([]);

        renderWithMantine(<CityDashboard cityId="c1" />);

        // Note: Mantine buttons might render text slightly differently (e.g. inside a span)
        // Using a regex /Advance Time/i is safest
        const tickBtn = screen.getByRole('button', { name: /Advance Time/i });
        fireEvent.click(tickBtn);

        // Wait for the async action to be called
        await waitFor(() => {
            expect(mockTick).toHaveBeenCalled();
        });
    });

    it('renders help tooltip icons for sector names', () => {
        const mockData: CityData = {
            city: { id: 'c1', worldId: 'w1', name: 'Test City', lastTick: Date.now(), techLevel: 'Iron', defense: 500, population: 1000, imports: [], exports: [] },
            sectors: [
                {
                    id: 's1', cityId: 'c1', type: 'FOOD & WATER',
                    supply: 50, demand: 50, equilibrium: 'VOLATILE',
                    startingChips: 2, competitionUndercutDice: 0, updatedAt: 0
                }
            ]
        };
        mockUseCityData.mockReturnValue(mockData);

        renderWithMantine(<CityDashboard cityId="c1" />);

        // There should be help buttons (one per sector row + one for Tick button)
        const helpButtons = screen.getAllByRole('button', { name: /help/i });
        expect(helpButtons.length).toBeGreaterThan(0);
    });

    it('displays sector definition tooltip on hover', async () => {
        const mockData: CityData = {
            city: { id: 'c1', worldId: 'w1', name: 'Test City', lastTick: Date.now(), techLevel: 'Iron', defense: 500, population: 1000, imports: [], exports: [] },
            sectors: [
                {
                    id: 's1', cityId: 'c1', type: 'FOOD & WATER',
                    supply: 50, demand: 50, equilibrium: 'VOLATILE',
                    startingChips: 2, competitionUndercutDice: 0, updatedAt: 0
                }
            ]
        };
        mockUseCityData.mockReturnValue(mockData);

        renderWithMantine(<CityDashboard cityId="c1" />);

        const user = userEvent.setup();
        // Find the help button inside the sector row for FOOD & WATER
        const sectorCell = screen.getByText('FOOD & WATER');
        const sectorRow = sectorCell.closest('tr')!;
        const helpButton = sectorRow.querySelector('button[aria-label="Help"]') as HTMLElement;

        await user.hover(helpButton);

        // Wait for tooltip content to appear — should contain sector definition text
        await waitFor(() => {
            expect(screen.getByText(/MREs, canned goods/i)).toBeInTheDocument();
        });
    });
});