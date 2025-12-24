import {useCityData} from '../../hooks/useCityData';
import {useSimWorker} from '../../hooks/useSimWorker';
import {db} from '../../services/db';
import {type ActionType, type SectorType, type UserAction} from '../../common/types';
import SectorRow from './SectorRow';
import './CityDashboard.css';

interface CityDashboardProps {
    cityId: string | null;
}

/**
 * The main dashboard component for a city's economy.
 * Connects the reactive data layer (Dexie) with the simulation layer (Web Worker).
 *
 * @param props - Component props containing the cityId.
 */
export default function CityDashboard({cityId}: CityDashboardProps) {
    const data = useCityData(cityId);
    const {busy, tick, applyActions} = useSimWorker();

    /*
    =====================================================================
                              Event handlers
    =====================================================================
     */

    /**
     * Advances the simulation time by one tick for all sectors in the current city.
     * Wraps the worker calculation and the database update in a single transaction.
     */
    const handleTick = async () => {
        if (!data || busy) return;

        try {
            // A. Calculate new state in Worker
            const updatedSectors = await tick(data.sectors);

            // B. Save to DB (React will auto-update because of useCityData)
            // We also update the City's lastTick timestamp
            await db.transaction('rw', db.sectors, db.cities, async () => {
                await db.sectors.bulkPut(updatedSectors);
                await db.cities.update(data.city.id, {lastTick: Date.now()});
            });

        } catch (error) {
            console.error("Tick failed", error);
            // In a real app, you might use a toast/snackbar here (floaty message
            // thingy, maybe add this to message service)
        }
    };

    /**
     * Applies a specific user action to a sector.
     * Sends the request to the worker for calculation and persists the result to the DB.
     *
     * @param sectorId - The ID of the target sector.
     * @param actionType - The type of action to perform (e.g., MARKET, SABOTAGE).
     * @param magnitude - The intensity of the action (0-10).
     */
    const handleAction = async (sectorId: string, actionType: ActionType, magnitude: number) => {
        if (!data || busy) return;
        // Find the specific sector to get its type
        const sector = data.sectors.find(s => s.id === sectorId);
        if (!sector) return;

        try {
            // Construct the action object
            const actionsMap: Record<SectorType, UserAction[]> = {
                [sector.type]: [{
                    sector: sector.type,
                    type: actionType,
                    magnitude: magnitude
                }]
            } as Record<SectorType, UserAction[]>;

            const updatedSectors = await applyActions(data.sectors, actionsMap);
            await db.sectors.bulkPut(updatedSectors);

        } catch (error) {
            console.error("Action failed", error);
        }
    };

    if (!cityId) return null;
    if (data === undefined) return <div className="dashboard-loading">Loading market
        data...</div>;
    if (data === null) return <div className="dashboard-error">City not found.</div>;
    const {city, sectors} = data;

    /*
    =====================================================================
                                Render
    =====================================================================
    */
    return (
        <div className="city-dashboard">
            {/* Header Section */}
            <div className="dashboard-header">
                <h2>{city.name} Market</h2>
                <div className="dashboard-controls">
                    <span className="last-tick">
                        Last Update: {new Date(city.lastTick).toLocaleTimeString()}
                    </span>
                    <button
                        onClick={handleTick}
                        className="btn btn-warning tick-btn"
                        disabled={busy} // Disable while worker is thinking
                    >
                        {busy ? 'Simulating...' : '⏱ Advance Time (Tick)'}
                    </button>
                </div>
            </div>

            {/* Main Sector Table */}
            <table className="dashboard-table">
                <thead>
                <tr>
                    <th className="col-type">Sector</th>
                    <th className="col-bar">Supply</th>
                    <th className="col-bar">Demand</th>
                    <th className="col-state">State</th>
                    <th className="col-stats">Stats</th>
                    <th className="col-price">Price</th>
                    <th className="col-actions">Actions</th>
                </tr>
                </thead>
                <tbody>
                {sectors.map(sector => (
                    <SectorRow
                        key={sector.id}
                        sector={sector}
                        onAction={handleAction}
                        isBusy={busy} // Pass busy state down to disable inputs
                    />
                ))}
                </tbody>
            </table>
        </div>
    );
}