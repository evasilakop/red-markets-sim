import { useEffect, useState } from 'react';
import type { World, City, Sector, SectorType, ActionType, UserAction } from './types';
import { createWorld, listWorlds, addCity, listCities, getCitySectors, updateSectorsInCity} from './worldService';
import {useSimWorker} from "./useSimWorker.ts";

export default function App() {
    // State for worlds
    const [worlds, setWorlds] = useState<World[]>([]);
    const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
    const [newWorldName, setNewWorldName] = useState('My World');
    const [selectedAction, setSelectedAction] = useState<ActionType>('MARKET');
    const [actionMagnitude, setActionMagnitude] = useState<number>(1);

    // State for cities
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    // State for sectors
    const [sectors, setSectors] = useState<Sector[]>([]);

    const { busy, applyActions, tick } = useSimWorker();

    // Add this inside your App component, just to test
    useEffect(() => {
        const worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
        worker.postMessage({ type: 'test' });
        worker.onmessage = (e) => console.log('Got from worker:', e.data);
    }, []);

    // Load worlds on app start
    useEffect(() => {
        refreshWorlds();
    }, []);

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
    async function refreshWorlds() {
        const ws = await listWorlds();
        setWorlds(ws);
        // Auto-select first world if none selected
        if (!selectedWorld && ws.length > 0) {
            setSelectedWorld(ws[0]);
        }
    }

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

    // Event handlers
    const handleCreateWorld = async () => {
        const world = await createWorld(newWorldName);
        await refreshWorlds();
        setSelectedWorld(world);
        setNewWorldName('My World'); // reset input
    };

    const handleAddCity = async () => {
        if (!selectedWorld) return;
        const name = prompt('City name?') || 'New City';
        const { city } = await addCity(selectedWorld.id, name);
        await refreshCities(selectedWorld.id);
        setSelectedCity(city); // auto-select the new city
    };

    const handleWorldChange = (worldId: string) => {
        const world = worlds.find(w => w.id === worldId) || null;
        setSelectedWorld(world);
        setSelectedCity(null); // clear city selection when changing worlds
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

    return (
        <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h1>Red Markets World Simulator</h1>

            {/* World Management */}
            <section style={{ marginBottom: 20, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
                <h3>Worlds</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <label>Select world:</label>
                    <select
                        value={selectedWorld?.id || ''}
                        onChange={e => handleWorldChange(e.target.value)}
                        style={{ minWidth: 150 }}
                    >
                        <option value="">-- Select a world --</option>
                        {worlds.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                        type="text"
                        value={newWorldName}
                        onChange={e => setNewWorldName(e.target.value)}
                        placeholder="World name"
                        style={{ minWidth: 150 }}
                    />
                    <button onClick={handleCreateWorld}>Create World</button>
                </div>
            </section>

            {/* City Management */}
            {selectedWorld && (
                <section style={{ marginBottom: 20, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
                    <h3>Cities in {selectedWorld.name}</h3>
                    <div style={{ marginBottom: 12 }}>
                        <button onClick={handleAddCity}>Add City</button>
                    </div>
                    {cities.length > 0 ? (
                        <div>
                            <label>Select city: </label>
                            <select
                                value={selectedCity?.id || ''}
                                onChange={e => {
                                    const city = cities.find(c => c.id === e.target.value) || null;
                                    setSelectedCity(city);
                                }}
                                style={{ minWidth: 150 }}
                            >
                                <option value="">-- Select a city --</option>
                                {cities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No cities yet. Add one to get started!</p>
                    )}
                </section>
            )}

            {/* Sector Display */}
            {selectedCity && sectors.length > 0 && (
                <section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
                    <h3>Sectors in {selectedCity.name}</h3>

                    {/* Action Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <label>Action:</label>
                        <select
                            value={selectedAction}
                            onChange={e => setSelectedAction(e.target.value as ActionType)}
                            style={{ minWidth: 150 }}
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
                        <label>Magnitude:</label>
                        <input
                            type="number"
                            min={0}
                            max={10}
                            value={actionMagnitude}
                            onChange={e => setActionMagnitude(parseInt(e.target.value) || 0)}
                            style={{width: 60}}
                        />

                        <button
                            onClick={handleTickCity}
                            disabled={busy}
                            style={{
                                marginLeft: 20,
                                padding: '4px 12px',
                                backgroundColor: busy ? '#ccc' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4
                            }}
                        >
                            {busy ? 'Processing...' : 'Advance Time (Tick)'}
                        </button>
                    </div>
                    {/* Sectors Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Sector</th>
                            <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>Supply</th>
                            <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>Demand</th>
                            <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>Equilibrium</th>
                            <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>CHIPS</th>
                            <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>Competition</th>
                            <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sectors.map(sector => (
                            <tr key={sector.id}>
                                <td style={{ padding: 8, border: '1px solid #ddd', fontFamily: 'monospace' }}>
                                    {sector.type}
                                </td>
                                <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                                    {sector.supply}
                                </td>
                                <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                                    {sector.demand}
                                </td>
                                <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                                    {sector.equilibrium}
                                </td>
                                <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                                    {sector.startingChips}
                                </td>
                                <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                                    {sector.competitionUndercutDice === 0
                                        ? 'No comp'
                                        : `${sector.competitionUndercutDice}d10 undercut`
                                    }
                                </td>
                                <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleApplyAction(sector.type)}
                                        disabled={busy}
                                        style={{
                                            padding: '2px 8px',
                                            fontSize: '12px',
                                            backgroundColor: busy ? '#ccc' : undefined
                                        }}
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
