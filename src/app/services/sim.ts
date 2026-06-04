import type {Equilibrium, Sector, UserAction} from '../common/types.ts';
import {DEFAULT_COEFFICIENTS} from './configService.ts';
import {MAX_MAGNITUDE, MAX_SUPPLY, MIN_MAGNITUDE, MIN_SUPPLY} from "../common/constants.ts";

let coefficients: typeof DEFAULT_COEFFICIENTS = { ...DEFAULT_COEFFICIENTS };

/**
 * Updates the simulation coefficients at runtime.
 * Useful for initializing from a file or changing settings mid-session.
 * Merges new coefficients with defaults to ensure all keys exist.
 */
export function setSimulationCoefficients(newCoeffs: Partial<typeof DEFAULT_COEFFICIENTS>) {
    coefficients = {
        ...DEFAULT_COEFFICIENTS,
        ...newCoeffs
    } as typeof DEFAULT_COEFFICIENTS;
}

export function deriveEquilibrium(supply: number, demand: number, prev?: Equilibrium): Equilibrium {
    const s = supply / MAX_SUPPLY;
    const d = demand / MAX_SUPPLY;
    const HIGH = 0.6;
    const LOW = 0.4;

    if (s >= HIGH && d < LOW) return 'FLOODED';
    if (s >= HIGH && d >= HIGH) return 'VOLATILE';
    if (s < LOW && d < LOW) return 'SUBSIDIARY';
    if (s < LOW && d >= HIGH) return 'SCARCE';

    const diff = s - d;
    if (diff > 0.1) return 'FLOODED';
    if (diff < -0.1) return 'SCARCE';

    return prev ?? ((s + d) / 2 >= 0.5 ? 'VOLATILE' : 'SUBSIDIARY');
}

export function chipsFor(eq: Equilibrium): number {
    const chipMap: Record<Equilibrium, number> = {
        FLOODED: 2,
        VOLATILE: 0,
        SUBSIDIARY: 3,
        SCARCE: 1
    };
    return chipMap[eq];
}

export function competitionDiceFor(eq: Equilibrium): number {
    const diceMap: Record<Equilibrium, number> = {
        FLOODED: -2,
        VOLATILE: 0,
        SUBSIDIARY: -3,
        SCARCE: -1
    };
    return diceMap[eq];
}

const clamp = (x: number, lo = MIN_SUPPLY, hi = MAX_SUPPLY) => Math.max(lo, Math.min(hi, x));

/**
 * Applies ambient noise (-2 to +2) to a sector.
 */
function applyNoise(sector: Sector): Sector {
    const supply = clamp(sector.supply + Math.floor(Math.random() * 5) - 2);
    const demand = clamp(sector.demand + Math.floor(Math.random() * 5) - 2);
    const equilibrium = deriveEquilibrium(supply, demand, sector.equilibrium);

    return {
        ...sector,
        supply,
        demand,
        equilibrium,
        startingChips: chipsFor(equilibrium),
        competitionUndercutDice: competitionDiceFor(equilibrium),
        updatedAt: Date.now()
    };
}

export function applyActionToSector(sector: Sector, action: UserAction): Sector {
    let { supply, demand } = sector;
    const m = Math.max(MIN_MAGNITUDE, Math.min(MAX_MAGNITUDE, action.magnitude));

    // Apply action effects based on type using externalized coefficients
    switch (action.type) {
        case 'INCREASE_SUPPLY':
            supply += coefficients.INCREASE_SUPPLY * m;
            break;
        case 'SUBCONTRACT':
            supply += coefficients.SUBCONTRACT * m;
            break;
        case 'REDUCE_SUPPLY':
            supply -= coefficients.REDUCE_SUPPLY * m;
            break;
        case 'RESTRICT_FLOW':
            supply -= coefficients.RESTRICT_FLOW * m;
            break;
        case 'SABOTAGE':
            supply -= coefficients.SABOTAGE * m;
            break;
        case 'INCREASE_DEMAND':
            demand += coefficients.INCREASE_DEMAND * m;
            break;
        case 'MARKET':
            demand += coefficients.MARKET * m;
            break;
        case 'DECREASE_DEMAND':
            demand -= coefficients.DECREASE_DEMAND * m;
            break;
        case 'PRICE_LOW':
            demand += coefficients.PRICE_LOW * m;
            break;
        case 'SPECULATE':
            demand += coefficients.SPECULATE * m;
            // Optional: 10% chance of snapback (demand -10)
            if (Math.random() < 0.1) {
                demand -= 10;
            }
            break;
    }

    // Clamp supply and demand to valid range
    supply = clamp(supply);
    demand = clamp(demand);

    // Derive new equilibrium and related values
    const equilibrium = deriveEquilibrium(supply, demand, sector.equilibrium);

    return {
        ...sector,
        supply,
        demand,
        equilibrium,
        startingChips: chipsFor(equilibrium),
        competitionUndercutDice: competitionDiceFor(equilibrium),
        updatedAt: Date.now()
    };
}

export function tickSector(sector: Sector): Sector {
    // Tick EXPLICITLY applies noise
    return applyNoise(sector);
}
