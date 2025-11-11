import React, { useEffect, useState } from 'react';
import type { World, City, Sector, SectorType, ActionType, UserAction } from './common/types.ts';
import { createWorld, listWorlds, addCity, listCities, getCitySectors, updateSectorsInCity} from './services/worldService.ts';
import { exportWorld, importWorld, deleteWorld } from './services/worldService.ts';
import {useSimWorker} from "./useSimWorker.ts";
import './App.css';

export default function App() {
    // File compatibility checks
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const SUPPORTED_FILE_TYPES = ['application/json', 'text/plain']; // JSON files can have either MIME type

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

    // World management states
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Error messages states
    const [message, setMessage] = useState<{
        type: 'success' | 'error' | 'warning';
        text: string;
    } | null>(null);

    // Helper function to show messages
    const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
        setMessage({ type, text });
        // Auto-clear after 5 seconds
        setTimeout(() => setMessage(null), 5000);
    };

    // Helper function to check browser compatibility
    const checkBrowserSupport = (): { supported: boolean; missingFeatures: string[] } => {
        const missing: string[] = [];

        // Check for File API support
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            missing.push('File API');
        }

        // Check for JSON support (should be universal, but just in case)
        if (!window.JSON) {
            missing.push('JSON parsing');
        }

        // Check for URL.createObjectURL (for downloads)
        if (!window.URL || !window.URL.createObjectURL) {
            missing.push('File downloads');
        }

        return {
            supported: missing.length === 0,
            missingFeatures: missing
        };
    };

    // Helper function to format file size for user display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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

    // To check browser features support
    useEffect(() => {
        const browserCheck = checkBrowserSupport();
        if (!browserCheck.supported) {
            showMessage('error',
                `Your browser doesn't support required features: ${browserCheck.missingFeatures.join(', ')}. Please use a modern browser.`
            );
        }
    }, []);


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
        if (!selectedWorld || isExporting) return;
        setIsExporting(true);
        setMessage(null); // Clear previous messages
        try {
            const result = await exportWorld(selectedWorld.id);
            if (result.success) {
                showMessage('success', result.message || 'World exported successfully');
            } else {
                showMessage('error', result.error || 'Export failed');
                alert(result.error);
            }
        } catch (error) {
            console.error('Export failed:', error);
            showMessage('error', 'Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteWorld = async () => {
        if (!selectedWorld || isDeleting) return;

        // Confirmation dialog
        const confirmed = confirm(`Delete world "${selectedWorld.name}"? This will remove all cities and sectors. This cannot be undone.`);
        if (!confirmed) return;
        setIsDeleting(true);
        setMessage(null);

        try {
            const result = await deleteWorld(selectedWorld.id);
            if (result.success) {
                console.log(result.message);
                // Clear selected world and refresh list
                showMessage('success', result.message || 'World deleted successfully');
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
            showMessage('error', 'Delete failed. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleImportWorld = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isImporting) return;

        // Check browser support first
        const browserCheck = checkBrowserSupport();
        if (!browserCheck.supported) {
            showMessage('error', `Browser not supported. Missing: ${browserCheck.missingFeatures.join(', ')}`);
            e.target.value = '';
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showMessage('error',
                `File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
            );
            e.target.value = '';
            return;
        }

        // Check file type (basic check - we'll do more validation after reading)
        if (!SUPPORTED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.json') && !file.name.endsWith('.rmworld.json')) {
            showMessage('warning', 'Unexpected file type. Expected .json or .rmworld.json file.');
            // Don't return here - let them try anyway, our validation will catch issues
        }

        setIsImporting(true);
        setMessage(null);

        try {
            const result = await importWorld(file);
            if (result.success) {
                showMessage('success', `World "${result.worldName}" imported successfully (${formatFileSize(file.size)})`);
                await refreshWorlds();
                const worlds = await listWorlds();
                const importedWorld = worlds.find(w => w.name === result.worldName);
                if (importedWorld) {
                    setSelectedWorld(importedWorld);
                }
            } else {
                showMessage('error', result.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import failed:', error);
            if (error instanceof Error) {
                // Check for specific browser errors
                if (error.message.includes('QuotaExceededError')) {
                    showMessage('error', 'Not enough storage space available.');
                } else if (error.message.includes('out of memory')) {
                    showMessage('error', 'File too large for available memory.');
                } else {
                    showMessage('error', `Import failed: ${error.message}`);
                }
            } else {
                showMessage('error', 'Import failed. Please try again.');
            }
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    /*
    =================================================
                        Tests
    =================================================
     */

    // Add this test function (you can remove it later or keep it for debugging)
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
                <button onClick={createLargeTestFile} className="btn">Create Large Test File</button>

                {/* Message Display */}
                {message && (
                    <div className="world-messages">
                        <div className={`message message-${message.type}`}>
                            {message.text}
                        </div>
                    </div>
                )}

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

                {/* Actions Row */}
                <div className="flex-row">
                    <label className="label-wide">Actions:</label>

                    {/* Create World */}
                    <input
                        type="text"
                        value={newWorldName}
                        onChange={e => setNewWorldName(e.target.value)}
                        placeholder="World name"
                        className="input-wide"
                        disabled={isImporting || isExporting || isDeleting}
                    />
                    <button
                        onClick={handleCreateWorld}
                        disabled={isImporting || isExporting || isDeleting}
                        className="btn btn-primary"
                    >
                        Create World
                    </button>


                    {/* World Operations - only show if world is selected */}
                    {selectedWorld && (
                        <>
                            <span className="divider">|</span>
                            <button
                                onClick={handleExportWorld}
                                disabled={isExporting || isImporting || isDeleting}
                                className={`btn btn-success ${isExporting ? 'btn-loading' : ''}`}
                            >
                                {isExporting ? 'Exporting' : 'Export World'}
                            </button>
                            <button
                                onClick={handleDeleteWorld}
                                disabled={isDeleting || isImporting || isExporting}
                                className={`btn btn-danger ${isDeleting ? 'btn-loading' : ''}`}
                            >
                                {isDeleting ? 'Deleting' : 'Delete World'}
                            </button>

                            {/* Add this temporarily after the Delete button */}
                            {selectedWorld && (
                                <button
                                    onClick={testExportImportRoundtrip}
                                    className="btn"
                                    style={{ backgroundColor: '#6c757d', color: 'white' }}
                                >
                                    Test Roundtrip
                                </button>
                            )}
                        </>
                    )}


                    {/* Import */}
                    <span className="divider">|</span>
                    <label className="label-wide">Import World:</label>
                    {/* Import Section */}
                    <input
                        id="import-world-file"
                        type="file"
                        accept=".json,.rmworld.json"
                        onChange={handleImportWorld}
                        disabled={isImporting || isExporting || isDeleting}
                        className="input-wide"
                        title={`Maximum file size: ${formatFileSize(MAX_FILE_SIZE)}`}
                    />

                    {isImporting && <span className="loading-text">Importing...</span>}
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
