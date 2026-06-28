import { screen, fireEvent, waitFor, render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { renderWithProviders } from '../../test-utils';
import AddCityWizard from '../../../app/components/CityManager/AddCityWizard';
import * as cityService from '../../../app/services/cityService';

vi.mock('../../../app/services/cityService', () => ({
    addCity: vi.fn().mockResolvedValue({
        city: { id: 'test-city', name: 'Test City' },
        sectors: [],
    }),
}));

vi.mock('@mantine/notifications', () => ({
    notifications: {
        show: vi.fn(),
        clean: vi.fn(),
    },
}));

describe('AddCityWizard', () => {
    const defaultProps = {
        opened: true,
        onClose: vi.fn(),
        onCreated: vi.fn(),
        worldId: 'test-world',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the first step (Basic Info)', () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);
        expect(screen.getByText(/Basic Info/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    });

    it('prevents moving to next step if name is empty', () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeDisabled();
    });

    it('allows moving to next step when name is provided', async () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);
        const nameInput = screen.getByLabelText(/Name/i);
        fireEvent.change(nameInput, { target: { value: 'New City' } });

        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).not.toBeDisabled();
        fireEvent.click(nextButton);

        expect(screen.getByText(/Review/i)).toBeInTheDocument();
    });

    it('shows random sector message on review in random mode', async () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Random City' } });
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        expect(screen.getByText(/randomly generated with supply and demand between 45 and 55/i)).toBeInTheDocument();
    });

    it('shows Sector Config step when "Custom Sectors" is selected', async () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Custom City' } });
        fireEvent.click(screen.getByText(/Custom Sectors/i));
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        expect(screen.getByText(/Sector Config/i)).toBeInTheDocument();
        expect(screen.getByText(/Supply \(0-100\)/i)).toBeInTheDocument();
    });

    it('calls addCity with correct data on confirmation (random mode)', async () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Final City' } });
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        fireEvent.click(screen.getByRole('button', { name: /Confirm & Create City/i }));

        await waitFor(() => {
            expect(cityService.addCity).toHaveBeenCalledWith(
                'test-world',
                expect.objectContaining({ name: 'Final City' }),
                undefined
            );
            expect(defaultProps.onCreated).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    it('calls addCity with customSectors on confirmation (custom mode)', async () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Custom Final City' } });
        fireEvent.click(screen.getByText(/Custom Sectors/i));
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        fireEvent.click(screen.getByRole('button', { name: /Confirm & Create City/i }));

        await waitFor(() => {
            expect(cityService.addCity).toHaveBeenCalledWith(
                'test-world',
                expect.objectContaining({ name: 'Custom Final City' }),
                expect.objectContaining({
                    'FOOD & WATER': expect.objectContaining({ supply: 50, demand: 50 }),
                })
            );
        });
    });

    it('resets form state when reopened', () => {
        const renderWizard = (opened: boolean) => render(
            <MantineProvider>
                <ModalsProvider>
                    <AddCityWizard {...defaultProps} opened={opened} />
                </ModalsProvider>
            </MantineProvider>
        );

        const { rerender } = renderWizard(true);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Temporary City' } });
        fireEvent.click(screen.getByText(/Custom Sectors/i));

        rerender(
            <MantineProvider>
                <ModalsProvider>
                    <AddCityWizard {...defaultProps} opened={false} />
                </ModalsProvider>
            </MantineProvider>
        );
        rerender(
            <MantineProvider>
                <ModalsProvider>
                    <AddCityWizard {...defaultProps} opened={true} />
                </ModalsProvider>
            </MantineProvider>
        );

        expect(screen.getByLabelText(/Name/i)).toHaveValue('');
    });
});
