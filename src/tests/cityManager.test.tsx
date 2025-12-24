import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityManager from '../app/components/CityManager/CityManager';
import type { City, World } from '../app/common/types';
import * as worldService from '../app/services/worldService';

// --- MOCKS ---

// 1. Use vi.hoisted for variables used inside mock factories
const { mockShowSuccess, mockShowError } = vi.hoisted(() => ({
    mockShowSuccess: vi.fn(),
    mockShowError: vi.fn()
}));

// 2. Mock Hooks so that we don't use the real ones
vi.mock('../app/hooks/useMessages', () => ({
    useMessages: () => ({
        showSuccess: mockShowSuccess,
        showError: mockShowError,
    }),
}));

// 3. Mock Services
vi.mock('../app/services/worldService');

// 4. Mock Components
// Path: src/tests -> ../app/components/MessageDisplay/MessageDisplay
vi.mock('../app/components/MessageDisplay/MessageDisplay', () => ({
    default: () => <div data-testid="message-display">Messages</div>
}));

interface MockConfirmationDialogProps {
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

vi.mock('../app/common/ConfirmationDialog', () => ({
    default: ({ message, confirmLabel, cancelLabel, onConfirm, onCancel }: MockConfirmationDialogProps) => (
        <div data-testid="confirmation-dialog">
            <p>{message}</p>
            <button onClick={onConfirm}>{confirmLabel}</button>
            <button onClick={onCancel}>{cancelLabel}</button>
        </div>
    )
}));

// --- TEST DATA ---

const mockWorld: World = {
    id: 'world-1',
    name: 'Test World',
    createdAt: Date.now(),
    notes: ''
};

const mockCities: City[] = [
    { id: 'city-1', worldId: 'world-1', name: 'City One', lastTick: Date.now() },
    { id: 'city-2', worldId: 'world-1', name: 'City Two', lastTick: Date.now() }
];

const defaultProps = {
    selectedWorld: mockWorld,
    cities: mockCities,
    selectedCity: mockCities[0],
    onCitySelect: vi.fn(),
    onCitiesChange: vi.fn()
};

// --- TESTS ---

describe('CityManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(worldService, 'listCities').mockResolvedValue(mockCities);
        vi.spyOn(worldService, 'addCity').mockResolvedValue({
            sectors: [],
            city: { id: 'new-city', worldId: 'world-1', name: 'New City', lastTick: Date.now() }
        });

        vi.spyOn(worldService, 'removeCity').mockResolvedValue({ success: true, message: 'Deleted' });
    });

    describe('Empty States', () => {
        it('renders nothing when no world is selected', () => {
            render(<CityManager {...defaultProps} selectedWorld={null} />);
            expect(screen.queryByText('Cities in Test World')).toBeNull();
        });

        it('shows empty state message when no cities exist', () => {
            render(<CityManager {...defaultProps} selectedCity={null} />);
            expect(screen.getByText('No cities yet. Add one to get started!')).toBeDefined();
            expect(screen.queryByText('Remove City')).toBeNull();
        });

        it('shows city list without highlighting when no city is selected', () => {
            render(<CityManager {...defaultProps} selectedCity={null} />);

            expect(screen.getByText('City One')).toBeDefined();
            expect(screen.getByText('City Two')).toBeDefined();
            expect(screen.queryByText('Remove City')).toBeNull();

            const cityButtons = screen.getAllByRole('button');
            const cityListButtons = cityButtons.filter(btn =>
                btn.textContent === 'City One' || btn.textContent === 'City Two'
            );
            cityListButtons.forEach(button => {
                expect(button.className).not.toContain('selected');
            });
        });
    });

    describe('City Selection', () => {
        it('highlights selected city', async () => {
            render(<CityManager {...defaultProps} />);

            // USE findByText (Async) instead of getByText
            const selectedCityButton = await screen.findByText('City One');
            expect(selectedCityButton.className).toContain('selected');
        });

        it('shows city list without highlighting when no city is selected', async () => {
            render(<CityManager {...defaultProps} selectedCity={null}/>);

            // Wait for data to load
            expect(await screen.findByText('City One')).toBeDefined();
            expect(screen.getByText('City Two')).toBeDefined();
        });

        it('calls onCitySelect when city is clicked', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            render(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);
            await user.click(screen.getByText('City Two'));

            expect(onCitySelect).toHaveBeenCalledWith(mockCities[1]);
        });

        it('shows Remove City button only when city is selected', () => {
            const { rerender } = render(<CityManager {...defaultProps} selectedCity={null} />);
            expect(screen.queryByText('Remove City')).toBeNull();

            rerender(<CityManager {...defaultProps} selectedCity={mockCities[0]} />);
            expect(screen.getByText('Remove City')).toBeDefined();
        });
    });

    describe('Add City', () => {
        it('prompts for city name and creates city', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            vi.stubGlobal('prompt', vi.fn().mockReturnValue('New Test City'));

            render(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);
            await user.click(screen.getByText('Add City'));

            expect(worldService.addCity).toHaveBeenCalledWith('world-1', 'New Test City');
            expect(worldService.listCities).toHaveBeenCalledWith('world-1');
        });

        it('uses default name when prompt is cancelled', async () => {
            const user = userEvent.setup();
            vi.stubGlobal('prompt', vi.fn().mockReturnValue(null));

            render(<CityManager {...defaultProps} />);
            await user.click(screen.getByText('Add City'));

            expect(worldService.addCity).toHaveBeenCalledWith('world-1', 'New City');
        });
    });

    describe('Delete City', () => {
        it('shows confirmation dialog when Remove City is clicked', async () => {
            const user = userEvent.setup();
            render(<CityManager {...defaultProps} />);

            await user.click(screen.getByText('Remove City'));

            expect(screen.getByText(/Delete city "City One"/)).toBeDefined();
            expect(screen.getByText('Delete')).toBeDefined();
            expect(screen.getByText('Cancel')).toBeDefined();
        });

        it('does not show confirmation dialog when no city is selected', async () => {
            render(<CityManager {...defaultProps} selectedCity={null} />);
            expect(screen.queryByText('Remove City')).toBeNull();
        });

        it('cancels deletion when Cancel is clicked', async () => {
            const user = userEvent.setup();
            render(<CityManager {...defaultProps} />);

            await user.click(screen.getByText('Remove City'));
            await user.click(screen.getByText('Cancel'));

            expect(screen.queryByTestId('confirmation-dialog')).toBeNull();
            expect(worldService.removeCity).not.toHaveBeenCalled();
        });

        it('deletes city when confirmed', async () => {
            const user = userEvent.setup();
            const onCitySelect = vi.fn();

            render(<CityManager {...defaultProps} onCitySelect={onCitySelect} />);

            await user.click(screen.getByText('Remove City'));
            await user.click(screen.getByText('Delete'));

            expect(worldService.removeCity).toHaveBeenCalledWith('city-1');

            await waitFor(() => {
                expect(onCitySelect).toHaveBeenCalledWith(null);
                expect(mockShowSuccess).toHaveBeenCalledWith('City deleted!');
            });
        });

        it('handles delete errors gracefully', async () => {
            const user = userEvent.setup();
            vi.mocked(worldService.removeCity).mockResolvedValue({
                success: false,
                error: 'Delete failed'
            });

            render(<CityManager {...defaultProps} />);

            await user.click(screen.getByText('Remove City'));
            await user.click(screen.getByText('Delete'));

            await waitFor(() => {
                expect(mockShowError).toHaveBeenCalledWith('Delete failed');
            });
        });

        it('handles delete exceptions', async () => {
            const user = userEvent.setup();
            vi.mocked(worldService.removeCity).mockRejectedValue(new Error('Network error'));

            render(<CityManager {...defaultProps} />);

            await user.click(screen.getByText('Remove City'));
            await user.click(screen.getByText('Delete'));

            await waitFor(() => {
                expect(mockShowError).toHaveBeenCalledWith('Delete failed. Check console for details.');
            });
        });
    });

    describe('World Changes', () => {
        it('refreshes cities when world changes', async () => {
            const { rerender } = render(<CityManager {...defaultProps} />);
            await screen.findByText('City One');
            const newWorld = { ...mockWorld, id: 'world-2', name: 'New World' };
            rerender(<CityManager {...defaultProps} selectedWorld={newWorld} />);

            expect(worldService.listCities).toHaveBeenCalledWith('world-2');
        });

        it('clears cities and selection when world is deselected', async () => {
            const onCitySelect = vi.fn();
            const { rerender } = render(
                <CityManager {...defaultProps} onCitySelect={onCitySelect} />
            );
            await screen.findByText('City One');
            rerender(
                <CityManager {...defaultProps}
                             selectedWorld={null}
                             onCitySelect={onCitySelect}
                />);

            expect(onCitySelect).toHaveBeenCalledWith(null);
            expect(screen.queryByText('Cities in Test World')).toBeNull();
        });
    });


    describe('Edge Cases', () => {
        it('handles empty city name gracefully', async () => {
            const user = userEvent.setup();
            vi.stubGlobal('prompt', vi.fn().mockReturnValue(''));

            render(<CityManager {...defaultProps} />);
            await user.click(screen.getByText('Add City'));

            expect(worldService.addCity).toHaveBeenCalledWith('world-1', 'New City');
        });

        it('does not attempt operations when world is null', async () => {
            render(<CityManager {...defaultProps} selectedWorld={null} />);
            expect(screen.queryByText('Add City')).toBeNull();
        });

        it('handles service errors during city refresh', async () => {
            vi.mocked(worldService.listCities).mockRejectedValue(new Error('Database error'));
            expect(() => {
                render(<CityManager {...defaultProps} />);
            }).not.toThrow();
        });
    });
});