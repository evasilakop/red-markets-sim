import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { ALL_SECTORS, type City, type Sector } from '../common/types';

export interface CityData {
    city: City;
    sectors: Sector[];
}

/**
 * A reactive hook that fetches a city and its sectors.
 * It automatically re-renders when the database changes.
 *
 * @param cityId - The ID of the city to watch.
 * @returns The city and sorted sectors, or undefined while loading.
 */
export function useCityData(cityId: string | null): CityData | undefined | null {
    return useLiveQuery(async () => {
        if (!cityId) return null;

        // Fetch City
        const city = await db.cities.get(cityId);
        if (!city) return null; // City might have been deleted

        // Fetch Sectors
        const sectors = await db.sectors
            .where('cityId')
            .equals(cityId)
            .toArray();

        // Sort Sectors based on the official rulebook order (ALL_SECTORS)
        // This ensures the table always looks the same, regardless of DB insertion order.
        sectors.sort((a, b) => {
            return ALL_SECTORS.indexOf(a.type) - ALL_SECTORS.indexOf(b.type);
        });

        return { city, sectors };
    }, [cityId]); // Re-run query if cityId changes
}