import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityManager from '../app/components/CityManager/CityManager';
import * as cityService from '../app/services/cityService';
import { renderWithProviders, createTestDb } from './test-utils';
import { mockWorld, mockCities } from './fixtures';
import * as dbModule from '../app/services/db';

// --- MOCKS ---
vi.mock('@mantine/notifications', () => ({
    notifications: {
        show: vi.fn(),
        clean: vi.fn(),
    }
}));

vi.mock('../app/services/worldService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../app/services/worldService')>();
    return {
        ...actual,
    };
});

// --- TEST DATA ---
const defaultProps = {
    selectedWorld: mockWorld,
    selectedCity: mockCities[0],
    onCitySelect: vi.fn(),
};

// --- TESTS ---

describe('CityManager', () => {
    let testDb: any;

    beforeEach(async () => {
        testDb = createTestDb();
        
        // Seed the database
        await testDb.worlds.add(mockWorld);
        await testDb.cities.bulkAdd(mockCities);

        // Replace the singleton db in the module with our testDb
        vi.spyOn(dbModule, 'db', 'get').mockReturnValue(testDb);

        // Mock service calls that we don't want to hit the real implementation of
        vi.spyOn(cityService, 'addCity').mockResolvedValue({
            sectors: [],
            city: mockCities[0]
        });
        vi.spyOn(cityService, 'removeCity').mockResolvedValue({ success: true, message: 'City deleted successfully.' });
    });

    afterEach(async () => {
        await testDb.close();
        vi.restoreAllMocks();
    });

    describe('City Selection', () => {
        it('highlights selected city', async () => {
            renderWithProviders(<CityManager {...defaultProps} />);

            // The chips are used for selection. We search by text.
            const selectedCityBtn = await screen.findByText('City One');
            expect(selectedCityBtn).toBeInTheDocument();
        });

        it('calls onCitySelect when city is clicked', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            renderWithProviders(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);

            const btn = await screen.findByText('City Two');
            await user.click(btn);

            expect(onCitySelect).toHaveBeenCalledWith(mockCities[1]);
        });
    });

    describe('Add City', () => {
        it('opens wizard and creates city', async () => {
            const user = userEvent.setup();

            renderWithProviders(<CityManager {...defaultProps} />);

            const addBtn = await screen.findByRole('button', { name: /Add City/i });
            await user.click(addBtn);

            const input = await screen.findByPlaceholderText('City name');
            await user.type(input, 'New Test City');

            const nextBtn = screen.getByRole('button', { name: /Next/i });
            await user.click(nextBtn);

            const confirmBtn = screen.getByRole('button', { name: /Confirm & Create City/i });
            await user.click(confirmBtn);

            expect(cityService.addCity).toHaveBeenCalledWith(
                'world-1',
                expect.objectContaining({ name: 'New Test City' }),
                undefined
            );
        });
    });

    describe('Delete City', () => {
        it('opens modal and deletes city', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            renderWithProviders(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);

            // 1. Click Remove
            const removeBtn = await screen.findByRole('button', { name: /Remove City/i });
            await user.click(removeBtn);

            // 2. Check Modal Text
            expect(await screen.findByText(/Are you sure you want to delete/i)).toBeInTheDocument();

            // 3. Click Confirm (Delete City)
            const confirmBtn = screen.getByRole('button', { name: 'Delete City' });
            await user.click(confirmBtn);

            expect(cityService.removeCity).toHaveBeenCalledWith('city-1');
        });
    });
});
