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

export interface City {
    id: string;
    worldId: string;
    name: string;
    lastTick: number;
    notes?: string | null;
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

export type MessageScope = 'world' | 'city' | 'sector' | 'settings';
export type MessageType = 'success' | 'warning' | 'error';