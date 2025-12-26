import {useEffect, useState} from 'react';
import type { City, World} from './common/types.ts';
import WorldManager from './components/WorldManager/WorldManager';
import CityManager from './components/CityManager/CityManager';
import {CityDashboard} from "./components/CityDashboard/CityDashboard.tsx";

export default function App() {
    // State for worlds
    const [selectedWorld, setSelectedWorld] = useState<World | null>(null);

    // State for cities
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    // Clears the city and sector displays when selecting a world
    useEffect(() => {
        if (selectedWorld) {
            setSelectedCity(null);
        } else {
            // No world selected - clear everything
            setSelectedCity(null);
        }
    }, [selectedWorld]);

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
            {/* CityManager component */}
            <CityManager
                selectedWorld={selectedWorld}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
            />
            {/* CityDashboard component */}
            <CityDashboard
                cityId={selectedCity?.id || null}
            />
        </div>
    );
}