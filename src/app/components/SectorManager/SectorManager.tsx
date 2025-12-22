import {useEffect} from 'react';
import type {
    ActionType,
    City,
    Sector,
    SectorType,
    UserAction
} from "../../common/types.ts";
import {getCitySectors, updateSectorsInCity} from "../../services/worldService.ts";
import {useMessages} from "../../hooks/useMessages.ts";
import MessageDisplay from "../MessageDisplay/MessageDisplay.tsx";


/**
 * Props for the Sector Manager component
 */
interface SectorManagerProps {
    /* The currently selected city */
    selectedCity: City | null;
    /* List of sectors for the selected city */
    sectors: Sector[];
    /* The currently selected action to apply to a sector */
    selectedAction: ActionType;
    /* Magnitude of the selected actions */
    actionMagnitude: number;
    /* Whether a background operation (worker) is currently running */
    busy: boolean;
    /* Callback invoked when the sectors list changes (e.g., after apply/tick/refresh) */
    onSectorsChange: (sectors: Sector[]) => void;
    /* Callback invoked when the selected action changes */
    onActionChange: (action: ActionType) => void;
    /* Callback invoked when the action magnitude changes */
    onMagnitudeChange: (magnitude: number) => void;
    /* Applies user actions via worker and returns updated sectors */
    applyActions: (sectors: Sector[], actions: Record<SectorType, UserAction[]>) => Promise<Sector[]>;
    /* Advances simulation (tick) via worker and returns updated sectors */
    tick: (sectors: Sector[]) => Promise<Sector[]>;
}

/**
 * React component for managing sector operations within the selected city.
 * Loads sectors when the city changes, applies actions via a web worker,
 * persist updates to the database, and provides user feedback for errors.
 * @param props Component props
 * @returns The rendered SectorManager component
 */
export default function SectorManager({
                                          selectedCity,
                                          sectors,
                                          selectedAction,
                                          actionMagnitude,
                                          busy,
                                          onSectorsChange,
                                          onActionChange,
                                          onMagnitudeChange,
                                          applyActions,
                                          tick
                                      }: SectorManagerProps) {
    const {showError} = useMessages('sector');

    // Load sectors when city changes
    useEffect(() => {
        if (selectedCity) {
            refreshSectors(selectedCity.id);
        } else {
            onSectorsChange([]);
        }
    }, [selectedCity, onSectorsChange]);

    /*
    ====================================================
                Event handlers
    ====================================================
     */

    /**
     * Loads sectors for the given city and updates parent state.
     * @param cityId The ID of the city whose sectors should be loaded
     */
    const refreshSectors = async (cityId: string) => {
        const ss = await getCitySectors(cityId);
        onSectorsChange(ss);
    };

    /**
     * Applies the selected action to a single sector type using the worker,
     * persists the updated sectors to the database, and updates parent state.
     * Displays an error message on failure.
     * @param sectorType The sector type to which the action should be applied
     */
    const handleApplyAction = async (sectorType: SectorType) => {
        if (!selectedCity || busy) return;

        try {
            // Create actions map for this single action
            const actions: Record<SectorType, UserAction[]> = {
                [sectorType]: [{
                    sector: sectorType,
                    type: selectedAction,
                    magnitude: actionMagnitude
                }]
            } as Record<SectorType, UserAction[]>;

            // Apply via worker
            const updatedSectors = await applyActions(sectors, actions);

            // Save to database
            await updateSectorsInCity(selectedCity.id, updatedSectors);

            // Update UI
            onSectorsChange(updatedSectors.sort((a, b) => a.type.localeCompare(b.type)));

        } catch (error) {
            console.error('Error applying action:', error);
            showError('Error applying action. Check console for details.');
        }
    };

    /**
     * Advances the simulation (tick) for the current city using the worker,
     * persists the updated sectors to the database, and updates parent state.
     * Displays an error message on failure.
     */
    const handleTickCity = async () => {
        if (!selectedCity || busy) return;
        try {
            // Apply tick via worker
            const updatedSectors = await tick(sectors);

            // Save to database
            await updateSectorsInCity(selectedCity.id, updatedSectors);

            // Update UI
            onSectorsChange(updatedSectors.sort((a, b) => a.type.localeCompare(b.type)));

        } catch (error) {
            console.error('Error ticking city:', error);
            showError('Error advancing time. Check console for details.');
        }
    };

    /*
    =====================================================================
                                    Render
    =====================================================================
    */
    return (
        <>
            {/* Sector Display */}
            {selectedCity && sectors.length > 0 && (
                <section className="sector-display">
                    <h3>Sectors in {selectedCity.name}</h3>
                    <MessageDisplay scope="sector"/>
                    {/* Action Controls */}
                    <div className="flex-row action-controls">
                        <label className="label">Action:</label>
                        <label htmlFor="action-select" className="label">Action:</label>
                        <select
                            id="action-select"
                            value={selectedAction}
                            onChange={e => onActionChange(e.target.value as ActionType)}
                            className="input-wide"
                            disabled={busy}
                        >
                            <option value="MARKET">Market</option>
                            <option value="INCREASE_DEMAND">Increase Demand</option>
                            <option value="DECREASE_DEMAND">Decrease Demand</option>
                            <option value="PRICE_LOW">Price Low</option>
                            <option value="SPECULATE">Speculate</option>
                            <option value="INCREASE_SUPPLY">Increase Supply</option>
                            <option value="SUBCONTRACT">Subcontract</option>
                            <option value="REDUCE_SUPPLY">Reduce Supply</option>
                            <option value="RESTRICT_FLOW">Restrict Flow</option>
                            <option value="SABOTAGE">Sabotage</option>
                        </select>

                        <label htmlFor="action-magnitude"
                               className="label">Magnitude:</label>
                        <input
                            id="action-magnitude"
                            type="number"
                            min={0}
                            max={10}
                            value={actionMagnitude}
                            onChange={e => onMagnitudeChange(parseInt(e.target.value) || 0)}
                            className="input-narrow"
                            disabled={busy}
                        />

                        <button
                            onClick={handleTickCity}
                            disabled={busy}
                            className="btn btn-primary tick-button"
                        >
                            {busy ? 'Processing...' : 'Advance Time (Tick)'}
                        </button>
                    </div>

                    {/* Sectors Table */}
                    <table className="sectors-table">
                        <thead>
                        <tr>
                            <th className="text-left">Sector</th>
                            <th className="text-center">Supply</th>
                            <th className="text-center">Demand</th>
                            <th className="text-center">Equilibrium</th>
                            <th className="text-center">CHIPS</th>
                            <th className="text-center">Competition</th>
                            <th className="text-center">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sectors.map(sector => (
                            <tr key={sector.id}>
                                <td className="sector-name">{sector.type}</td>
                                <td>{sector.supply}</td>
                                <td>{sector.demand}</td>
                                <td>{sector.equilibrium}</td>
                                <td>{sector.startingChips}</td>
                                <td>
                                    {sector.competitionUndercutDice === 0
                                        ? 'No comp'
                                        : `${sector.competitionUndercutDice}d10 undercut`
                                    }
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleApplyAction(sector.type)}
                                        disabled={busy}
                                        className="btn-small"
                                    >
                                        {busy ? '...' : 'Apply'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            )}
        </>
    )
}