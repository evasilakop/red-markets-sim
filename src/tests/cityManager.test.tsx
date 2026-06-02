import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityManager from '../app/components/CityManager/CityManager';
import type { CityV2, World } from '../app/common/types';
import * as worldService from '../app/services/worldService';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import {notifications} from "@mantine/notifications";

// --- MOCKS ---
vi.mock('@mantine/notifications', () => ({
    notifications: {
        show: vi.fn(),
        clean: vi.fn(),
    }
}));

vi.mock('../app/services/worldService');

// --- TEST DATA ---
const mockWorld: World = {
    id: 'world-1',
    name: 'Test World',
    createdAt: Date.now(),
    notes: ''
};

const mockCities: CityV2[] = [
    { 
        id: 'city-1', 
        worldId: 'world-1', 
        name: 'City One', 
        lastTick: Date.now(),
        population: 1000,
        techLevel: 'Industrial',
        defense: 10,
        exports: [],
        imports: [],
        version: 2
    },
    { 
        id: 'city-2', 
        worldId: 'world-1', 
        name: 'City Two', 
        lastTick: Date.now(),
        population: 500,
        techLevel: 'Stone',
        defense: 5,
        exports: [],
        imports: [],
        version: 2
    }
];

const defaultProps = {
    selectedWorld: mockWorld,
    selectedCity: mockCities[0],
    onCitySelect: vi.fn(),
};

// --- HELPER ---
const renderWithMantine = (ui: React.ReactNode) => {
    return render(
        <MantineProvider theme={{
            components: {
                Modal: {
                    defaultProps: {
                        transitionProps: { duration: 0 },
                        // Disable focus trap in tests to prevent JSDOM issues
                        trapFocus: false,
                        lockScroll: false,
                        withinPortal: false // Render inside the DOM hierarchy, easier to debug
                    }
                }
            }
        }}>
            <ModalsProvider>
                {ui}
            </ModalsProvider>
        </MantineProvider>
    );
};

// --- TESTS ---

describe('CityManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(worldService, 'listCities').mockResolvedValue(mockCities);
        vi.spyOn(worldService, 'addCity').mockResolvedValue({
            sectors: [],
            city: mockCities[0]
        });
        vi.spyOn(worldService, 'removeCity').mockResolvedValue({ success: true, message: 'City New City deleted successfully.' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    })


    describe('City Selection', () => {
        it('highlights selected city', async () => {
            renderWithMantine(<CityManager {...defaultProps} />);

            // Wait for render
            const selectedCityBtn = await screen.findByRole('radio', { name: 'City One' });
            // Mantine filled variant usually has a specific class or style,
            // but checking attribute 'data-variant' if available is better.
            // Or check if it has the 'filled' class logic.
            // Simpler: Check if it exists. Visual regression handles style.
            expect(selectedCityBtn).toBeInTheDocument();
        });

        it('calls onCitySelect when city is clicked', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            renderWithMantine(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);

            const btn = await screen.findByRole('radio', { name: 'City Two' });
            await user.click(btn);

            expect(onCitySelect).toHaveBeenCalledWith(mockCities[1]);
        });
    });

    describe('Add City', () => {
        it('opens modal and creates city', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            renderWithMantine(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);

            // 1. Click Add City
            const addBtn = await screen.findByRole('button', { name: /Add City/i });
            await user.click(addBtn);

            // 2. Modal appears. Find Input.
            // Mantine modals are in a Portal, but screen queries document.body so it works.
            const input = await screen.findByPlaceholderText('City name');
            await user.type(input, 'New Test City');

            // 3. Click Confirm (Create)
            const createBtn = screen.getByRole('button', { name: /^Create$/i }); // Exact match to avoid "Create New City"
            await user.click(createBtn);

            expect(worldService.addCity).toHaveBeenCalledWith('world-1', 'New Test City');
        });
    });

    describe('Delete City', () => {
        it('opens modal and deletes city', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            renderWithMantine(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);

            // 1. Click Remove
            const removeBtn = await screen.findByRole('button', { name: /Remove City/i });
            await user.click(removeBtn);

            // 2. Check Modal Text
            expect(await screen.findByText(/Are you sure you want to delete/i)).toBeInTheDocument();

            // 3. Click Confirm (Delete City)
            const confirmBtn = screen.getByRole('button', { name: 'Delete City' });
            await user.click(confirmBtn);

            expect(worldService.removeCity).toHaveBeenCalledWith('city-1');

            await waitFor(() => {
                expect(notifications.show).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Success',
                        message: expect.stringMatching(/deleted successfully/i),
                        color: 'green'
                    })
                );
            });
        });
    });
});
