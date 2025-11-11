import { useEffect, useState } from 'react';
import type { World, City, Sector, SectorType, ActionType, UserAction } from './common/types.ts';
import { addCity, listCities, getCitySectors, updateSectorsInCity} from './services/worldService.ts';
import WorldManager from './components/WorldManager/WorldManager';
import {useSimWorker} from "./hooks/useSimWorker.ts";
import './App.css';

export default function App() {
    // State for worlds
    const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
    const [selectedAction, setSelectedAction] = useState<ActionType>('MARKET');
    const [actionMagnitude, setActionMagnitude] = useState<number>(1);

    // State for cities
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    // State for sectors
    const [sectors, setSectors] = useState<Sector[]>([]);

    // WebWorker states
    const {busy, applyActions, tick} = useSimWorker();

    // Load cities when world changes
    useEffect(() => {
        if (selectedWorld) {
            refreshCities(selectedWorld.id);
        } else {
            setCities([]);
            setSelectedCity(null);
            setSectors([]);
        }
    }, [selectedWorld]);

    // Load sectors when city changes
    useEffect(() => {
        if (selectedCity) {
            refreshSectors(selectedCity.id);
        } else {
            setSectors([]);
        }
    }, [selectedCity]);

    // Helper functions

    /*
    Why refresh instead of just adding to state?
        Single source of truth: Database is authoritative
        Consistency: Ensures UI matches database exactly
        Simplicity: Same logic for all city list updates
     */
    async function refreshCities(worldId: string) {
        const cs = await listCities(worldId);
        setCities(cs);
        // Auto-select first city if none selected
        if (!selectedCity && cs.length > 0) {
            setSelectedCity(cs[0]);
        }
    }

    async function refreshSectors(cityId: string) {
        const ss = await getCitySectors(cityId);
        setSectors(ss);
    }

    /*
    ========================================
                Event handlers
    ========================================
     */

    const handleAddCity = async () => {
        if (!selectedWorld) return;
        const name = prompt('City name:') || 'New City';
        const {city} = await addCity(selectedWorld.id, name);
        await refreshCities(selectedWorld.id);
        setSelectedCity(city); // auto-select the new city
    };

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
            setSectors(updatedSectors.sort((a, b) => a.type.localeCompare(b.type)));

        } catch (error) {
            console.error('Error applying action:', error);
            alert('Error applying action. Check console for details.');
        }
    };

    const handleTickCity = async () => {
        if (!selectedCity || busy) return;
        try {
            // Apply tick via worker
            const updatedSectors = await tick(sectors);

            // Save to database
            await updateSectorsInCity(selectedCity.id, updatedSectors);

            // Update UI
            setSectors(updatedSectors.sort((a, b) => a.type.localeCompare(b.type)));

        } catch (error) {
            console.error('Error ticking city:', error);
            alert('Error advancing time. Check console for details.');
        }
    };

    /*
    =================================================
                        Tests
    =================================================
     */

    {/*   // Add this test function (you can remove it later or keep it for debugging)
    const testExportImportRoundtrip = async () => {
        if (!selectedWorld) {
            showMessage('error', 'Select a world to test roundtrip');
            return;
        }

        console.log('🧪 Testing export → import roundtrip...');

        try {
            // Get original data
            const originalWorld = selectedWorld;
            const originalCities = await listCities(selectedWorld.id);
            const originalSectors = [];
            for (const city of originalCities) {
                const sectors = await getCitySectors(city.id);
                originalSectors.push(...sectors);
            }

            // Export
            const exportResult = await exportWorld(selectedWorld.id);
            if (!exportResult.success) {
                console.error('❌ Export failed:', exportResult.error);
                return;
            }

            console.log('✅ Export successful');
            console.log('📊 Original data:', {
                world: originalWorld,
                cities: originalCities.length,
                sectors: originalSectors.length
            });

            showMessage('success', 'Roundtrip test completed - check console for details');

        } catch (error) {
            console.error('❌ Roundtrip test failed:', error);
            showMessage('error', 'Roundtrip test failed - check console');
        }
    };

// Add this temporary test function
    const createLargeTestFile = () => {
        // Create a large JSON string (about 15MB)
        const largeData = {
            version: 1,
            world: { id: "test", name: "Large World", createdAt: Date.now() },
            cities: [],
            sectors: [],
            // Add lots of fake data to make it large
            padding: "x".repeat(15 * 1024 * 1024) // 15MB of 'x' characters
        };

        const blob = new Blob([JSON.stringify(largeData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'large-test-file.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
*/}


    /*
    =================================================
                        Render
    =================================================
     */
    return (
        <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h1>Red Markets World Simulator</h1>
            {/*<button onClick={createLargeTestFile} className="btn">Create Large Test File</button>*/}
            {/* WorldManager component */}
            <WorldManager
                selectedWorld={selectedWorld}
                onWorldSelect={setSelectedWorld}
            />

            {/* City Management */}
            {selectedWorld && (
                <section className="section">
                    <h3>Cities in {selectedWorld.name}</h3>

                    <div className="flex-row">
                        <button onClick={handleAddCity} className="btn btn-primary">
                            Add City
                        </button>
                    </div>

                    {cities.length > 0 ? (
                        <div className="flex-row">
                            <label htmlFor="city-select" className="label">Select city:</label>
                            <select
                                id="city-select"
                                value={selectedCity?.id || ''}
                                onChange={e => {
                                    const city = cities.find(c => c.id === e.target.value) || null;
                                    setSelectedCity(city);
                                }}
                                className="input-wide"
                            >
                            <option value="">-- Select a city --</option>
                                {cities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p className="city-empty-state">
                            No cities yet. Add one to get started!
                        </p>
                    )}
                </section>
            )}

            {/* Sector Display */}
            {selectedCity && sectors.length > 0 && (
                <section className="sector-display">
                    <h3>Sectors in {selectedCity.name}</h3>

                    {/* Action Controls */}
                    <div className="flex-row action-controls">
                        <label className="label">Action:</label>
                        <label htmlFor="action-select" className="label">Action:</label>
                        <select
                            id="action-select"
                            value={selectedAction}
                            onChange={e => setSelectedAction(e.target.value as ActionType)}
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

                        <label htmlFor="action-magnitude" className="label">Magnitude:</label>
                        <input
                            id="action-magnitude"
                            type="number"
                            min={0}
                            max={10}
                            value={actionMagnitude}
                            onChange={e => setActionMagnitude(parseInt(e.target.value) || 0)}
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
        </div>
    );
}
