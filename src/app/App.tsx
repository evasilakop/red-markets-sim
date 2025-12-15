import {useEffect, useState} from 'react';
import type {ActionType, City, Sector, World} from './common/types.ts';

import WorldManager from './components/WorldManager/WorldManager';
import CityManager from './components/CityManager/CityManager';
import SectorManager from "./components/SectorManager/SectorManager.tsx";
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

    // Clears the city and sector displays when selecting a world
    useEffect(() => {
        if (selectedWorld) {
            // World changed - clear city/sector state so components can load fresh data
            setSelectedCity(null);
            setSectors([]);
        } else {
            // No world selected - clear everything
            setCities([]);
            setSelectedCity(null);
            setSectors([]);
        }
    }, [selectedWorld]);

    /*
    ========================================
                Event handlers
    ========================================
     */
    // const handleApplyAction = async (sectorType: SectorType) => {
    //     if (!selectedCity || busy) return;
    //
    //     try {
    //         // Create actions map for this single action
    //         const actions: Record<SectorType, UserAction[]> = {
    //             [sectorType]: [{
    //                 sector: sectorType,
    //                 type: selectedAction,
    //                 magnitude: actionMagnitude
    //             }]
    //         } as Record<SectorType, UserAction[]>;
    //
    //         // Apply via worker
    //         const updatedSectors = await applyActions(sectors, actions);
    //
    //         // Save to database
    //         await updateSectorsInCity(selectedCity.id, updatedSectors);
    //
    //         // Update UI
    //         setSectors(updatedSectors.sort((a, b) => a.type.localeCompare(b.type)));
    //
    //     } catch (error) {
    //         console.error('Error applying action:', error);
    //         alert('Error applying action. Check console for details.');
    //     }
    // };
    //
    // const handleTickCity = async () => {
    //     if (!selectedCity || busy) return;
    //     try {
    //         // Apply tick via worker
    //         const updatedSectors = await tick(sectors);
    //
    //         // Save to database
    //         await updateSectorsInCity(selectedCity.id, updatedSectors);
    //
    //         // Update UI
    //         setSectors(updatedSectors.sort((a, b) => a.type.localeCompare(b.type)));
    //
    //     } catch (error) {
    //         console.error('Error ticking city:', error);
    //         alert('Error advancing time. Check console for details.');
    //     }
    // };

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

        console.log('Testing export → import roundtrip...');

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
                console.error('Export failed:', exportResult.error);
                return;
            }

            console.log('Export successful');
            console.log('Original data:', {
                world: originalWorld,
                cities: originalCities.length,
                sectors: originalSectors.length
            });

            showMessage('success', 'Roundtrip test completed - check console for details');

        } catch (error) {
            console.error('Roundtrip test failed:', error);
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
            {/* CityManager component*/}
            <CityManager
                selectedWorld={selectedWorld}
                cities={cities}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
                onCitiesChange={setCities}
            />
            {/*SectorManager component*/}
            <SectorManager
                selectedCity={selectedCity}
                sectors={sectors}
                selectedAction={selectedAction}
                actionMagnitude={actionMagnitude}
                busy={busy}
                onSectorsChange={setSectors}
                onActionChange={setSelectedAction}
                onMagnitudeChange={setActionMagnitude}
                applyActions={applyActions}
                tick={tick}
            />
        </div>
    );
}