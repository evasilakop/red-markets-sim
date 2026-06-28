import { screen, fireEvent, waitFor, render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { ALL_SECTORS, type SectorType } from '../../../app/common/types';
import { renderWithProviders } from '../../test-utils';
import AddCityWizard from '../../../app/components/CityManager/AddCityWizard';
import * as cityService from '../../../app/services/cityService';

/**
 * Builds a full sector map with uniform supply/demand for test fixtures.
 */
function buildSectorMap(supply: number, demand: number): Record<SectorType, { supply: number; demand: number }> {
    return ALL_SECTORS.reduce(
        (acc, type) => ({ ...acc, [type]: { supply, demand } }),
        {} as Record<SectorType, { supply: number; demand: number }>
    );
}

vi.mock('../../../app/services/cityService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../app/services/cityService')>();
    return {
        ...actual,
        addCity: vi.fn().mockResolvedValue({
            city: { id: 'test-city', name: 'Test City' },
            sectors: [],
        }),
        generateRandomSectors: vi.fn(() => buildSectorMap(50, 50)),
    };
});

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
        vi.mocked(cityService.generateRandomSectors).mockImplementation(() => buildSectorMap(50, 50));
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

    it('shows pre-generated sector values on review in random mode', async () => {
        vi.mocked(cityService.generateRandomSectors).mockReturnValue({
            ...buildSectorMap(50, 50),
            'FOOD & WATER': { supply: 47, demand: 52 },
        });

        renderWithProviders(<AddCityWizard {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Random City' } });
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        expect(screen.getByText('47/52')).toBeInTheDocument();
    });

    it('regenerates sector values when Random Sectors is clicked again', async () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);

        expect(cityService.generateRandomSectors).toHaveBeenCalled();

        vi.mocked(cityService.generateRandomSectors).mockClear();
        fireEvent.click(screen.getByText(/Random Sectors/i));

        expect(cityService.generateRandomSectors).toHaveBeenCalledTimes(1);
    });

    it('shows Sector Values step when "Custom Sectors" is selected', async () => {
        renderWithProviders(<AddCityWizard {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Custom City' } });
        fireEvent.click(screen.getByText(/Custom Sectors/i));
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        expect(screen.getByText(/Sector Values/i)).toBeInTheDocument();
        expect(screen.getByText(/Supply \(0-100\)/i)).toBeInTheDocument();
    });

    it('calls addCity with pre-generated sectors on confirmation (random mode)', async () => {
        const randomSectors = buildSectorMap(48, 51);
        vi.mocked(cityService.generateRandomSectors).mockReturnValue(randomSectors);

        renderWithProviders(<AddCityWizard {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Final City' } });
        fireEvent.click(screen.getByRole('button', { name: /Next/i }));

        fireEvent.click(screen.getByRole('button', { name: /Confirm & Create City/i }));

        await waitFor(() => {
            expect(cityService.addCity).toHaveBeenCalledWith(
                'test-world',
                expect.objectContaining({ name: 'Final City' }),
                randomSectors
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
