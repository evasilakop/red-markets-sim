import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils';
import SectorConfigGrid from '../../../app/components/CityManager/SectorConfigGrid';
import { ALL_SECTORS, type SectorType } from '../../../app/common/types';

interface SectorValues {
    supply: number;
    demand: number;
}

describe('SectorConfigGrid', () => {
    const mockValues = ALL_SECTORS.reduce((acc, type) => ({ 
        ...acc, 
        [type]: { supply: 50, demand: 50 } 
    }), {} as Record<SectorType, SectorValues>);

    const mockOnChange = vi.fn();

    it('renders all 10 sectors', () => {
        renderWithProviders(<SectorConfigGrid values={mockValues} onChange={mockOnChange} />);
        
        ALL_SECTORS.forEach(type => {
            expect(screen.getByText(type)).toBeInTheDocument();
        });
    });

    it('calls onChange when supply is updated', () => {
        renderWithProviders(<SectorConfigGrid values={mockValues} onChange={mockOnChange} />);
        
        // Mantine NumberInput renders an input element. 
        // We look for all inputs and pick the first one (Supply for first sector)
        const inputs = screen.getAllByRole('textbox');
        fireEvent.change(inputs[0], { target: { value: '60' } });
        
        expect(mockOnChange).toHaveBeenCalledWith(ALL_SECTORS[0], { supply: 60 });
    });

    it('calls onChange when demand is updated', () => {
        renderWithProviders(<SectorConfigGrid values={mockValues} onChange={mockOnChange} />);
        
        const inputs = screen.getAllByRole('textbox');
        // The second input is the Demand for the first sector
        fireEvent.change(inputs[1], { target: { value: '40' } });
        
        expect(mockOnChange).toHaveBeenCalledWith(ALL_SECTORS[0], { demand: 40 });
    });

    it('displays correct equilibrium preview based on values', () => {
        const scarceValues = { ...mockValues };
        scarceValues[ALL_SECTORS[0]] = { supply: 10, demand: 90 };

        renderWithProviders(<SectorConfigGrid values={scarceValues} onChange={mockOnChange} />);
        
        const badges = screen.getAllByText(/SCARCE|FLOODED|VOLATILE|SUBSIDIARY/);
        expect(badges[0].textContent).toBe('SCARCE');
    });

    it('renders text instead of inputs when readOnly is true', () => {
        renderWithProviders(<SectorConfigGrid values={mockValues} readOnly />);

        expect(screen.queryAllByRole('textbox')).toHaveLength(0);
        expect(screen.getAllByText('50').length).toBeGreaterThanOrEqual(2);
    });
});
