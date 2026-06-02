/**
 * Default coefficients used as a fallback if the config file is missing or malformed.
 * These match the baseline rules from the MARKET TOOLS PDF.
 */
export const DEFAULT_COEFFICIENTS: Record<string, number> = {
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

export type ActionCoefficients = typeof DEFAULT_COEFFICIENTS;

/**
 * Parses a KEY=VALUE text file and returns a coefficient map.
 * 
 * @param content The raw text content from the .txt file
 * @returns A map of action names to their numeric coefficients
 */
export function parseSimulationWeights(content: string): ActionCoefficients {
    const coefficients: Partial<ActionCoefficients> = {};
    
    const lines = content.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        
        // Skip comments and empty lines
        if (!line || line.startsWith('#')) {
            continue;
        }
        
        // Parse KEY=VALUE
        const [key, value] = line.split('=').map(s => s.trim());
        
        if (key && value) {
            const numValue = Number.parseFloat(value);
            if (!Number.isNaN(numValue)) {
                // Use type assertion as we know the keys in the file 
                // should match the ActionType names
                (coefficients as any)[key] = numValue;
            }
        }
    }
    
    // Merge parsed values with defaults to ensure every key is present
    return {
        ...DEFAULT_COEFFICIENTS,
        ...coefficients
    } as ActionCoefficients;
}