import {
    type ActionType,
    type MessageType,
    type SectorType
} from './types';

/*
    ===========================================
                  Message utils
    ===========================================
*/

export const ALL_MESSAGE_TYPES: MessageType[] = ['success', 'warning', 'error'];

/*
    ===========================================
                Market constants
    ===========================================
 */

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

export const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
    { value: 'MARKET', label: 'Market (+Dem)' },
    { value: 'INCREASE_DEMAND', label: 'Inc Demand (+Dem)' },
    { value: 'PRICE_LOW', label: 'Price Low (+Dem)' },
    { value: 'SPECULATE', label: 'Speculate (+Dem)' },
    { value: 'DECREASE_DEMAND', label: 'Dec Demand (-Dem)' },
    { value: 'INCREASE_SUPPLY', label: 'Inc Supply (+Sup)' },
    { value: 'SUBCONTRACT', label: 'Subcontract (+Sup)' },
    { value: 'REDUCE_SUPPLY', label: 'Red Supply (-Sup)' },
    { value: 'RESTRICT_FLOW', label: 'Restrict Flow (-Sup)' },
    { value: 'SABOTAGE', label: 'Sabotage (-Sup)' },
];

export const MIN_SUPPLY = 0;
export const MAX_SUPPLY = 100;

export const MIN_MAGNITUDE = 0;
export const MAX_MAGNITUDE = 10;