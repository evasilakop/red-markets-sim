/*
================================================
            Business Logic Types
================================================
 */

export type SectorType =
    | 'FOOD & WATER'
    | 'SHELTER'
    | 'MATERIAL'
    | 'PRODUCTS'
    | 'ENERGY'
    | 'MEDICINE'
    | 'SPECULATIVE'
    | 'TRANSPORTATION'
    | 'DATA'
    | 'HR';

export const ALL_SECTORS: SectorType[] = [
    'FOOD & WATER',
    'SHELTER',
    'MATERIAL',
    'PRODUCTS',
    'ENERGY',
    'MEDICINE',
    'SPECULATIVE',
    'TRANSPORTATION',
    'DATA',
    'HR'
];

export type Equilibrium = 'FLOODED' | 'VOLATILE' | 'SUBSIDIARY' | 'SCARCE';

export interface World {
    id: string;
    name: string;
    createdAt: number;
    notes?: string | null;
}

export type TechLevel = 'Stone' | 'Iron' | 'Industrial' | 'Digital' | 'Cutting Edge';

export interface CityV1 {
    id: string;
    worldId: string;
    name: string;
    lastTick: number;
    notes?: string | null;
}

export interface CityV2 {
    id: string;
    worldId: string;
    name: string;
    lastTick: number;
    notes?: string | null;
    population: number;
    techLevel: TechLevel;
    defense: number;
    exports: string[];
    imports: string[];
    version: 2;
}

export type City = CityV1 | CityV2;

/**
 * Type guard to check if a city has been migrated to V2.
 */
export function isCityV2(city: City): city is CityV2 {
    return (city as CityV2).version === 2;
}

export interface Sector {
    id: string;
    cityId: string;
    type: SectorType;
    supply: number;
    demand: number;
    equilibrium: Equilibrium;
    startingChips: number;
    competitionUndercutDice: number;
    priceIndex?: number | null;         // user-owned; display-only
    updatedAt: number;
}

export type ActionType =
    | 'INCREASE_SUPPLY'
    | 'SUBCONTRACT'
    | 'REDUCE_SUPPLY'
    | 'RESTRICT_FLOW'
    | 'SABOTAGE'
    | 'INCREASE_DEMAND'
    | 'MARKET'
    | 'PRICE_LOW'
    | 'DECREASE_DEMAND'
    | 'SPECULATE';

export interface UserAction {
    sector: SectorType;
    type: ActionType;
    magnitude: number;
}

/*
=======================================================
                 Worker message types
=======================================================
 */

export type ApplyActionsMsg = {
    type: 'applyActions';
    sectors: Sector[];
    actions: Record<SectorType, UserAction[]>;
};

export type TickMsg = {
    type: 'tick';
    sectors: Sector[];
};

export type WorkerRequest = (ApplyActionsMsg | TickMsg) & {id: string};

export type ResultMsg = {
    type: 'result';
    sectors: Sector[];
};

export type ErrorMsg = {
    type: 'error';
    message: string;
};

export type WorkerResponse = (ResultMsg | ErrorMsg) & {id: string};

export type OperationResult = {
    success: boolean;
    message?: string;
    error?: string;
};

/*
====================================================
                     Message utils
====================================================
 */

export type MessageType = 'success' | 'warning' | 'error';