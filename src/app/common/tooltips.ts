import {type ActionType, type Equilibrium, type SectorType} from './types';

/*
 * =====================================================================
 *  Sector Definitions
 *  Source: MARKET TOOLS — Job Creator (Goods columns)
 * =====================================================================
 */
export const SECTOR_DEFINITIONS: Record<SectorType, string> = {
    'FOOD & WATER':
        'MREs, canned goods, sports drinks, seeds, aquifers, hay. Basic sustenance for survival in the enclave.',
    SHELTER:
        'Real estate, respites, square footage, prefabs, fencing. Places and materials for habitation and protection.',
    MATERIAL:
        'Cloth, lumber, rubber, plastic, chemicals, concrete, metal. Raw materials used for construction and manufacturing.',
    PRODUCTS:
        'Weapons, ammunition, specs, machinery, armor, spare parts. Finished goods and equipment for trade or defense.',
    ENERGY:
        'Wood, diesel, aviation gas, solar panels, batteries, cable. Power sources and energy infrastructure.',
    MEDICINE:
        'Antibiotics, bandages, tubing, narcotics, surgical equipment. Medical supplies and pharmaceuticals.',
    SPECULATIVE:
        'Fads, scams, priceless objects, sentimental value. Items whose worth is driven by perception rather than utility.',
    TRANSPORTATION:
        'RVs, drones, cars, locomotives, gliders, tractors. Vehicles and transport infrastructure for moving goods and people.',
    DATA:
        'Evidence, proprietary software, records, deeds. Information assets with strategic or legal value.',
    HR:
        'People: doctors, recruits, cults, resettlers, workers. Human resources and skilled labor.',
};

/*
 * =====================================================================
 *  Equilibrium Definitions
 *  Source: MARKET TOOLS — Supply/Demand Chart
 * =====================================================================
 */
export const EQUILIBRIUM_DEFINITIONS: Record<Equilibrium, string> = {
    FLOODED:
        'A surplus of goods and many providers lower demand and prices. Everyone trades but no one prospers — finer quality is needed to stand out in this crowded market.',
    VOLATILE:
        'Both supply and demand are high, creating a hot but unstable market. Prices shift rapidly as competition intensifies and opportunities come and go quickly.',
    SUBSIDIARY:
        'Low demand and shrinking supply mean there isn\'t much to choose from and few care. Returns are marginal with minimal price difference between consumer and wholesale.',
    SCARCE:
        'Shortages and a lack of service providers inflate pricing. Optimal for a sustainable business, but the high margins constantly invite new competition.',
};

/*
 * =====================================================================
 *  Action Definitions
 *  Source: TAKER HANDBOOK — Negotiations; MARKET TOOLS — Manipulations
 * =====================================================================
 */
export const ACTION_DEFINITIONS: Record<ActionType, string> = {
    MARKET:
        'Set a unit price or perform a negotiated score. The default price is 10b per Haul of hardware, workers, or goods recovered. Drives demand through active trading.',
    INCREASE_DEMAND:
        'Market the product and alter conditions to increase need. Find investors willing to subsidize production or coerce pricing to raise demand.',
    PRICE_LOW:
        'Offer goods at reduced prices to attract more buyers and increase demand. Entice customers with cheap add-ons or premium experiences.',
    SPECULATE:
        'Invest now in anticipation of a future rise in demand. Bet on market trends before they materialize for potentially large returns.',
    DECREASE_DEMAND:
        'Reduce consumer interest in the sector. Flood awareness with alternatives or manufacture doubt about the product\'s value.',
    INCREASE_SUPPLY:
        'Bring more goods into the sector through production, trade, or recovery. Expand the available stockpile for the market.',
    SUBCONTRACT:
        'Hire other crews or wholesalers to boost supply. Outsource portions of the work to increase overall output in the sector.',
    REDUCE_SUPPLY:
        'Consume, waste, or remove goods from the market. Artificially shrink the available stock to drive up scarcity and prices.',
    RESTRICT_FLOW:
        'Block the movement of materials into or out of the sector. Control access points, roads, and distribution channels.',
    SABOTAGE:
        'Destroy infrastructure or goods, hinder production, and interfere with operations. Directly damage the sector\'s capacity to supply.',
};

/*
 * =====================================================================
 *  Stat Definitions
 *  Source: MARKET TOOLS — Supply/Demand Chart (CHIPS, Competition)
 * =====================================================================
 */
export const STAT_DEFINITIONS: Record<string, string> = {
    CHIPS:
        'Starting CHIPS represent client leverage in the sector. More CHIPS mean greater buying power and influence over market outcomes.',
    COMP:
        'Competition undercut dice represent rival crews competing for the same job. More dice mean fiercer competition that can erode profits.',
    'Price Index':
        'A display-only measure of current pricing in the sector, derived from the balance of supply and demand.',
};
