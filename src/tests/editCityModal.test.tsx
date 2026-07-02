import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditCityModal from '../app/components/CityDashboard/EditCityModal';
import * as cityService from '../app/services/cityService';
import { renderWithProviders, createTestDb } from './test-utils';
import * as dbModule from '../app/services/db';
import type { City } from '../app/common/types';
import { type RMDB } from '../app/services/db';

// --- MOCKS ---
vi.mock('@mantine/notifications', () => ({
    notifications: {
        show: vi.fn(),
        clean: vi.fn(),
    }
}));

// --- TEST DATA ---
const mockCity: City = {
    id: 'city-1',
    worldId: 'world-1',
    name: 'Test City',
    lastTick: Date.now(),
    notes: 'Original notes',
    population: 1000,
    techLevel: 'Industrial',
    defense: 10,
    exports: ['Food', 'Water'],
    imports: ['Steel', 'Fuel']
};

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    city: mockCity,
    onSaved: vi.fn()
};

// --- TESTS ---

describe('EditCityModal', () => {
    let testDb: RMDB;

    beforeEach(async () => {
        testDb = createTestDb();
        vi.spyOn(dbModule, 'db', 'get').mockReturnValue(testDb);
        vi.spyOn(cityService, 'updateCity').mockResolvedValue(undefined);
    });

    afterEach(async () => {
        await testDb?.close();
        vi.restoreAllMocks();
    });

    describe('Rendering', () => {
        it('renders the modal when opened', () => {
            renderWithProviders(<EditCityModal {...defaultProps} />);
            expect(screen.getByText('Edit City')).toBeInTheDocument();
        });

        it('displays all city fields with current values', () => {
            renderWithProviders(<EditCityModal {...defaultProps} />);

            expect(screen.getByLabelText('Name')).toHaveValue('Test City');
            expect(screen.getByLabelText('Population')).toHaveValue('1000');
            expect(screen.getByLabelText('Defense')).toHaveValue('10');
            expect(screen.getByLabelText('Notes')).toHaveValue('Original notes');
        });
    });

    describe('Form Interaction', () => {
        it('updates name field when typed into', async () => {
            const user = userEvent.setup();
            renderWithProviders(<EditCityModal {...defaultProps} />);

            const nameInput = screen.getByLabelText('Name');
            await user.clear(nameInput);
            await user.type(nameInput, 'Updated City');

            expect(nameInput).toHaveValue('Updated City');
        });

        it('updates population field when changed', async () => {
            const user = userEvent.setup();
            renderWithProviders(<EditCityModal {...defaultProps} />);

            const populationInput = screen.getByLabelText('Population');
            await user.clear(populationInput);
            await user.type(populationInput, '5000');

            expect(populationInput).toHaveValue('5000');
        });

        it('updates defense field when changed', async () => {
            const user = userEvent.setup();
            renderWithProviders(<EditCityModal {...defaultProps} />);

            const defenseInput = screen.getByLabelText('Defense');
            await user.clear(defenseInput);
            await user.type(defenseInput, '25');

            expect(defenseInput).toHaveValue('25');
        });

        it('updates notes field when typed into', async () => {
            const user = userEvent.setup();
            renderWithProviders(<EditCityModal {...defaultProps} />);

            const notesInput = screen.getByLabelText('Notes');
            await user.clear(notesInput);
            await user.type(notesInput, 'New notes');

            expect(notesInput).toHaveValue('New notes');
        });
    });

    describe('Save Functionality', () => {
        it('calls updateCity with updated values when saved', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();
            const onSaved = vi.fn();

            renderWithProviders(
                <EditCityModal
                    opened={true}
                    onClose={onClose}
                    city={mockCity}
                    onSaved={onSaved}
                />
            );

            const nameInput = screen.getByLabelText('Name');
            await user.clear(nameInput);
            await user.type(nameInput, 'Updated City');

            const populationInput = screen.getByLabelText('Population');
            await user.clear(populationInput);
            await user.type(populationInput, '5000');

            const saveBtn = screen.getByRole('button', { name: 'Save' });
            await user.click(saveBtn);

            await waitFor(() => {
                expect(cityService.updateCity).toHaveBeenCalledWith('city-1', {
                    name: 'Updated City',
                    population: 5000,
                    techLevel: 'Industrial',
                    defense: 10,
                    notes: 'Original notes',
                    exports: ['Food', 'Water'],
                    imports: ['Steel', 'Fuel']
                });
            });
        });

        it('closes modal when save is clicked', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();

            renderWithProviders(
                <EditCityModal
                    opened={true}
                    onClose={onClose}
                    city={mockCity}
                    onSaved={vi.fn()}
                />
            );

            const saveBtn = screen.getByRole('button', { name: 'Save' });
            await user.click(saveBtn);

            await waitFor(() => {
                expect(onClose).toHaveBeenCalled();
            });
        });

        it('calls onSaved callback when save is clicked', async () => {
            const user = userEvent.setup();
            const onSaved = vi.fn();

            renderWithProviders(
                <EditCityModal
                    opened={true}
                    onClose={vi.fn()}
                    city={mockCity}
                    onSaved={onSaved}
                />
            );

            const saveBtn = screen.getByRole('button', { name: 'Save' });
            await user.click(saveBtn);

            await waitFor(() => {
                expect(onSaved).toHaveBeenCalled();
            });
        });
    });

    describe('Cancel Functionality', () => {
        it('closes modal when cancel is clicked', async () => {
            const user = userEvent.setup();
            const onClose = vi.fn();

            renderWithProviders(
                <EditCityModal
                    opened={true}
                    onClose={onClose}
                    city={mockCity}
                    onSaved={vi.fn()}
                />
            );

            const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
            await user.click(cancelBtn);

            expect(onClose).toHaveBeenCalled();
            expect(cityService.updateCity).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('handles city with null notes', () => {
            const cityWithNullNotes: City = {
                ...mockCity,
                notes: null
            };

            renderWithProviders(
                <EditCityModal
                    opened={true}
                    onClose={vi.fn()}
                    city={cityWithNullNotes}
                    onSaved={vi.fn()}
                />
            );

            expect(screen.getByLabelText('Notes')).toHaveValue('');
        });

        it('handles city with empty exports/imports', () => {
            const cityWithEmptyLists: City = {
                ...mockCity,
                exports: [],
                imports: []
            };

            renderWithProviders(
                <EditCityModal
                    opened={true}
                    onClose={vi.fn()}
                    city={cityWithEmptyLists}
                    onSaved={vi.fn()}
                />
            );

            expect(screen.getByText('Exports')).toBeInTheDocument();
            expect(screen.getByText('Imports')).toBeInTheDocument();
        });
    });
});
