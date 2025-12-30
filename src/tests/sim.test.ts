import {describe, expect, it} from 'vitest';
import {
    chipsFor,
    competitionDiceFor,
    deriveEquilibrium,
    applyActionToSector,
    tickSector
} from '../app/services/sim.ts';
import type { Sector } from '../app/common/types';

describe('deriveEquilibrium', () => {
    it('FLOODED when high supply, low demand', () => {
        expect(deriveEquilibrium(90, 30)).toBe('FLOODED'); // S=0.9, D=0.3
    });

    it('VOLATILE when high supply, high demand', () => {
        expect(deriveEquilibrium(70, 70)).toBe('VOLATILE'); // S=0.7, D=0.7
    });

    it('SUBSIDIARY when low supply, low demand', () => {
        expect(deriveEquilibrium(30, 30)).toBe('SUBSIDIARY'); // S=0.3, D=0.3
    });

    it('SCARCE when low supply, high demand', () => {
        expect(deriveEquilibrium(30, 80)).toBe('SCARCE'); // S=0.3, D=0.8
    });

    it('tie-breaker: favors FLOODED if S-D > +0.10', () => {
        // S=0.56, D=0.44 → diff=0.12
        expect(deriveEquilibrium(56, 44)).toBe('FLOODED');
    });

    it('tie-breaker: favors SCARCE if S-D < -0.10', () => {
        // S=0.44, D=0.56 → diff=-0.12
        expect(deriveEquilibrium(44, 56)).toBe('SCARCE');
    });

    it('tie-breaker: keep previous equilibrium when within ±0.10', () => {
        // S=0.55, D=0.50 → diff=0.05 (within band), keep prev = VOLATILE
        expect(deriveEquilibrium(55, 50, 'VOLATILE')).toBe('VOLATILE');
    });

    it('tie-breaker: initial bias when no previous', () => {
        // S=0.49, D=0.49 → avg=0.49 < 0.5 → SUBSIDIARY
        expect(deriveEquilibrium(49, 49)).toBe('SUBSIDIARY');
        // S=0.51, D=0.51 → avg=0.51 ≥ 0.5 → VOLATILE
        expect(deriveEquilibrium(51, 51)).toBe('VOLATILE');
    });

    it('edge thresholds: HIGH >= 0.60, LOW < 0.40', () => {
        expect(deriveEquilibrium(60, 39)).toBe('FLOODED');     // HIGH & below LOW
        expect(deriveEquilibrium(60, 60)).toBe('VOLATILE');    // both HIGH
        expect(deriveEquilibrium(39, 39)).toBe('SUBSIDIARY');  // both LOW
        expect(deriveEquilibrium(39, 60)).toBe('SCARCE');      // LOW & HIGH
    });
});

describe('chipsFor', () => {
    it('maps equilibrium to starting CHIPS', () => {
        expect(chipsFor('FLOODED')).toBe(2);
        expect(chipsFor('VOLATILE')).toBe(0);
        expect(chipsFor('SUBSIDIARY')).toBe(3);
        expect(chipsFor('SCARCE')).toBe(1);
    });
});

describe('competitionDiceFor', () => {
    it('maps equilibrium to competition undercut dice', () => {
        expect(competitionDiceFor('FLOODED')).toBe(-2);
        expect(competitionDiceFor('VOLATILE')).toBe(0);
        expect(competitionDiceFor('SUBSIDIARY')).toBe(-3);
        expect(competitionDiceFor('SCARCE')).toBe(-1);
    });
});

// Helper to create a dummy sector for testing actions/ticks
const createSector = (overrides?: Partial<Sector>): Sector => ({
    id: 'test-id',
    cityId: 'city-id',
    type: 'FOOD & WATER',
    supply: 50,
    demand: 50,
    equilibrium: 'VOLATILE',
    startingChips: 0,
    competitionUndercutDice: 0,
    updatedAt: Date.now(),
    ...overrides
});

describe('tickSector', () => {
    it('should drift values slightly (ambient noise)', () => {
        // Force random to be 0.9 -> floor(4.5)-2 = 2 so there IS noise otherwise the
        // test can randomly fail depending on the seed
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const sector = createSector({ supply: 50, demand: 50 });
        const result = tickSector(sector);

        expect(result.supply).not.toBe(50); // Will be 52
        expect(result.supply).toBeGreaterThan(40);

        randomSpy.mockRestore();
    });

    it('should clamp values between 0 and 100', () => {
        // Force a massive drift up (simulating via repeated ticks or extreme noise)
        // We simulate this by mocking a sector that is already at the limit
        const sector = createSector({ supply: 100, demand: 100 });
        const result = tickSector(sector);

        expect(result.supply).toBeLessThanOrEqual(100);
        expect(result.demand).toBeLessThanOrEqual(100);
        expect(result.supply).toBeGreaterThanOrEqual(0);
    });
});

describe('applyActionToSector', () => {
    it('should increase demand when action is INCREASE_DEMAND', () => {
        const sector = createSector({ demand: 50 });
        const action = { sector: 'FOOD & WATER' as const, type: 'INCREASE_DEMAND' as const, magnitude: 5 };

        const result = applyActionToSector(sector, action);
        expect(result.demand).toBeGreaterThan(50);
    });

    it('should decrease supply when action is SABOTAGE', () => {
        const sector = createSector({ supply: 50 });
        const action = { sector: 'FOOD & WATER' as const, type: 'SABOTAGE' as const, magnitude: 5 };

        const result = applyActionToSector(sector, action);
        expect(result.supply).toBeLessThan(50);
    });

    it('should clamp values after action', () => {
        const sector = createSector({ supply: 98 });
        const action = { sector: 'FOOD & WATER' as const, type: 'INCREASE_SUPPLY' as const, magnitude: 10 };

        const result = applyActionToSector(sector, action);
        expect(result.supply).toBe(100); // Should not exceed 100
    });
});