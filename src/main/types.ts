export type SectorType =
    | 'FOOD & WATER' | 'SHELTER'
    | 'MATERIAL' | 'PRODUCTS'
    | 'ENERGY' | 'MEDICINE'
    | 'SPECULATIVE' | 'TRANSPORTATION'
    | 'DATA' | 'HR';

export const ALL_SECTORS: SectorType[] = [
    'FOOD & WATER','SHELTER','MATERIAL','PRODUCTS','ENERGY',
    'MEDICINE','SPECULATIVE','TRANSPORTATION','DATA','HR'
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
    priceIndex?: number | null; // user-owned; display-only
    updatedAt: number;
}

export type ActionType =
    | 'INCREASE_SUPPLY' | 'SUBCONTRACT'
    | 'REDUCE_SUPPLY' | 'RESTRICT_FLOW'
    | 'SABOTAGE' | 'INCREASE_DEMAND'
    | 'MARKET' | 'PRICE_LOW'
    | 'DECREASE_DEMAND' | 'SPECULATE';

export interface UserAction {
    sector: SectorType;
    type: ActionType;
    magnitude: number; // 0-10
}
