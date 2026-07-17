import { useEffect, useState } from 'react';
import { AppShell } from '@mantine/core';
import { type World, type City } from './common/types';
import CityManager from './components/CityManager/CityManager';
import CityDashboard from './components/CityDashboard/CityDashboard';
import WorldTopBar from './components/WorldManager/WorldTopBar';
import { parseSimulationWeights } from './services/configService';
import { setSimulationCoefficients } from './services/sim';

export default function App() {
    const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    // Load configuration on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                // In a Vite/web environment, assets in 'public' are served at root '/'
                // Since our file is in 'src/app/config', we might need to move it to 'public'
                // for easy fetching, OR we use a fetch relative to the base URL.
                // Assuming the dev server serves files from the root.
                const response = await fetch('/config/simulation_weights.txt');
                if (response.ok) {
                    const content = await response.text();
                    const weights = parseSimulationWeights(content);
                    setSimulationCoefficients(weights);
                    console.log('Simulation coefficients loaded from config file.');
                } else {
                    console.warn('Could not load simulation_weights.txt, using defaults.');
                }
            } catch (error) {
                console.error('Error loading simulation coefficients:', error);
            }
        };

        loadConfig();
    }, []);

    // Reset city when world changes
    const handleWorldSelect = (world: World | null) => {
        setSelectedWorld(world);
        setSelectedCity(null);
    };
    return (
        <AppShell header={{ height: { base: 120, sm: 60 } }}
                  padding={'md'}>
            <AppShell.Header>
                <WorldTopBar
                    selectedWorld={selectedWorld}
                    onWorldSelect={handleWorldSelect}
                />
            </AppShell.Header>

            <AppShell.Main>
                <CityManager
                    selectedWorld={selectedWorld}
                    selectedCity={selectedCity}
                    onCitySelect={setSelectedCity}
                />
                <CityDashboard cityId={selectedCity?.id || null} />
            </AppShell.Main>
        </AppShell>
    );
}
