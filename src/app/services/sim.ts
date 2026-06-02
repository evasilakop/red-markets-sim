import type {Equilibrium, Sector, UserAction} from '../common/types.ts';
import { parseSimulationWeights } from './configService';

// Note: In a real app, we would fetch this from a file/network. 
// For now, we assume the config is available via an import or a static block 
// to avoid async complexity in the pure simulation functions.
// We use a placeholder that will be replaced by the actual parsed config.

// This is a placeholder. In a production environment, 
// this would be populated during the app's initialization phase.
let coefficients: ReturnType<typeof parseSimulationWeights> = {
    INCREASE_SUPPLY: 3,
    SUBCONTRACT: 3,
    REDUCE_SUPPLY: 4,
    RESTRICT_FLOW: 4,
    SABOTAGE: 4,
    INCREASE_DEMAND: 3,
    MARKET: 3,
    DECREASE_DEMAND: 3,
    PRICE_LOW: 2,
    SPECULATE: 4,
};

/**
 * Updates the simulation coefficients at runtime.
 * Useful for initializing from a file or changing settings mid-session.
 */
export function setSimulationCoefficients(newCoeffs: ReturnType<typeof parseSimulationWeights>) {
    coefficients = newCoeffs;
}

export function deriveEquilibrium(supply: number, demand: number, prev?: Equilibrium): Equilibrium {
    const s = supply / 100, d = demand / 100;
    const HIGH = 0.6, LOW = 0.4;
    if (s >= HIGH && d < LOW) return 'FLOODED';
    if (s >= HIGH && d >= HIGH) return 'VOLATILE';
    if (s < LOW && d < LOW) return 'SUBSIDIARY';
    if (s < LOW && d >= HIGH) return 'SCARCE';
    const diff = s - d;
    if (diff > 0.1) return 'FLOODED';
    if (diff < -0.1) return 'SCARCE';
    return prev ?? ((s + d) / 2 >= 0.5 ? 'VOLATILE' : 'SUBSIDIARY');
}

export function chipsFor(eq: Equilibrium) {
    return eq === 'FLOODED' ? 2 : eq === 'VOLATILE' ? 0 : eq === 'SUBSIDIARY' ? 3 : 1;
}

export function competitionDiceFor(eq: Equilibrium) {
    return eq === 'FLOODED' ? -2 : eq === 'VOLATILE' ? 0 : eq === 'SUBSIDIARY' ? -3 : -1;
}

const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));

// helper function to apply noise to the simulated actions
function applyNoise(sector: Sector): Sector {
    let { supply, demand } = sector;

    // Apply ambient noise (-2 to +2)
    supply = clamp(supply + Math.floor(Math.random() * 5) - 2);
    demand = clamp(demand + Math.floor(Math.random() * 5) - 2);

    // Re-derive equilibrium after noise
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
    let supply = sector.supply;
    let demand = sector.demand;
    const m = Math.max(0, Math.min(10, action.magnitude)); // clamp magnitude 0-10

    // Apply action effects based on type using externalized coefficients
    switch (action.type) {
        case 'INCREASE_SUPPLY':
            supply += (coefficients.INCREASE_SUPPLY || 3) * m;
            break;
        case 'SUBCONTRACT':
            supply += (coefficients.SUBCONTRACT || 3) * m;
            break;
        case 'REDUCE_SUPPLY':
            supply -= (coefficients.REDUCE_SUPPLY || 4) * m;
            break;
        case 'RESTRICT_FLOW':
            supply -= (coefficients.RESTRICT_FLOW || 4) * m;
            break;
        case 'SABOTAGE':
            supply -= (coefficients.SABOTAGE || 4) * m;
            break;
        case 'INCREASE_DEMAND':
            demand += (coefficients.INCREASE_DEMAND || 3) * m;
            break;
        case 'MARKET':
            demand += (coefficients.MARKET || 3) * m;
            break;
        case 'DECREASE_DEMAND':
            demand -= (coefficients.DECREASE_DEMAND || 3) * m;
            break;
        case 'PRICE_LOW':
            demand += (coefficients.PRICE_LOW || 2) * m;
            break;
        case 'SPECULATE':
            demand += (coefficients.SPECULATE || 4) * m;
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
    // Tick now EXPLICITLY applies noise
    return applyNoise(sector);
}
