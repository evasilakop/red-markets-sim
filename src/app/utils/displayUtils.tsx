import { type Equilibrium } from '../common/types';

// Simple mapping for UI colors (using standard Material Design-ish colors)
export const EQUILIBRIUM_COLORS: Record<Equilibrium, string> = {
    FLOODED: '#2e7d32',   // Green (Good/Cheap)
    VOLATILE: '#ed6c02',  // Orange (Warning)
    SUBSIDIARY: '#0288d1',// Blue (Stable/Corporate)
    SCARCE: '#d32f2f'     // Red (Bad/Expensive)
};

export const EQUILIBRIUM_LABELS: Record<Equilibrium, string> = {
    FLOODED: 'Flooded',
    VOLATILE: 'Volatile',
    SUBSIDIARY: 'Subsidiary',
    SCARCE: 'Scarce'
};

/**
 * Returns the color and friendly label for an equilibrium state.
 */
export function getEquilibriumDisplay(state: Equilibrium) {
    return {
        label: EQUILIBRIUM_LABELS[state],
        color: EQUILIBRIUM_COLORS[state]
    };
}

/**
 * Formats the Price Index for display.
 * Returns a placeholder if the value is missing.
 */
export function formatPriceIndex(index?: number | null): string {
    if (index === undefined || index === null) return '—';
    return index.toFixed(0);
}