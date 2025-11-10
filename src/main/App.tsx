import React, { useEffect, useState } from 'react';
import type { World, City, Sector, SectorType, ActionType, UserAction } from './types';
import { createWorld, listWorlds, addCity, listCities, getCitySectors, updateSectorsInCity} from './worldService';
import { exportWorld, importWorld, deleteWorld } from './worldService';
import {useSimWorker} from "./useSimWorker.ts";
import './App.css';

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

    // WebWorker states
    const { busy, applyActions, tick } = useSimWorker();

    // just to test React effects
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
    const handleCreateWorld = async () => {
        const world = await createWorld(newWorldName || 'World');
        await refreshWorlds();
        setSelectedWorld(world);

        // Clear city and sector states for the new world
        setSelectedCity(null);
        setCities([]);
        setSectors([]);

        setNewWorldName('My World'); // reset input
    };

    const handleAddCity = async () => {
        if (!selectedWorld) return;
        const name = prompt('City name:') || 'New City';
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

    const handleExportWorld = async () => {
        if (!selectedWorld) return;

        try {
            const result = await exportWorld(selectedWorld.id);
            if (result.success) {
                console.log(result.message); // TODO add proper messages later
            } else {
                console.error(result.error);
                alert(result.error);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleDeleteWorld = async () => {
        if (!selectedWorld) return;

        // Confirmation dialog
        const confirmed = confirm(`Delete world "${selectedWorld.name}"? This will remove all cities and sectors. This cannot be undone.`);
        if (!confirmed) return;

        try {
            const result = await deleteWorld(selectedWorld.id);
            if (result.success) {
                console.log(result.message);
                // Clear selected world and refresh list
                setSelectedWorld(null);
                setSelectedCity(null);
                setSectors([]);
                await refreshWorlds();
            } else {
                console.error(result.error);
                alert(result.error);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Delete failed. Check console for details.');
        }
    };

    const handleImportWorld = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await importWorld(file);
            if (result.success) {
                console.log(`World "${result.worldName}" imported successfully`);
                // Refresh worlds list and select the imported one
                await refreshWorlds();
                const worlds = await listWorlds();
                const importedWorld = worlds.find(w => w.name === result.worldName);
                if (importedWorld) {
                    setSelectedWorld(importedWorld);
                }
            } else {
                console.error(result.error);
                alert(`Import failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Check console for details.');
        }

        // Clear the file input
        e.target.value = '';
    };

    /*
    =================================================
                        Render
    =================================================
     */
    return (
        <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h1>Red Markets World Simulator</h1>

            {/* World Management */}
            <section className="section">
                <h3>World Management</h3>

                {/* World Selection Row */}
                <div className="flex-row">
                    <label htmlFor="world-select" className="label-wide">World:</label>
                    <select
                        id="world-select"
                        value={selectedWorld?.id || ''}
                        onChange={e => handleWorldChange(e.target.value)}
                        className="input-wide"
                    >
                    <option value="">
                            {worlds.length === 0 ? 'No worlds yet' : 'Select a world...'}
                        </option>
                        {worlds.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>

                {/* Create New World Row */}
                <div className="flex-row">
                    <label className="label-wide">Create new:</label>
                    <input
                        type="text"
                        value={newWorldName}
                        onChange={e => setNewWorldName(e.target.value)}
                        placeholder="World name"
                        className="input-wide"
                    />
                    <button onClick={handleCreateWorld} className="btn btn-primary">
                        Create World
                    </button>
                </div>

                {/* World Actions Row */}
                {selectedWorld && (
                    <div className="flex-row">
                        <label className="label-wide">Actions:</label>
                        <div className="button-group">
                            <button onClick={() => handleExportWorld()} className="btn btn-success">
                                Export World
                            </button>
                            <button onClick={() => handleDeleteWorld()} className="btn btn-danger">
                                Delete World
                            </button>
                        </div>
                    </div>
                )}

                {/* Import Row */}
                <div className="flex-row world-import">
                    <label htmlFor="import-world-file" className="label-wide">Import world:</label>
                    <input
                        id="import-world-file"
                        type="file"
                        accept=".json,.rmworld.json"
                        onChange={handleImportWorld}
                        className="input-wide"
                    />
                </div>
            </section>

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
