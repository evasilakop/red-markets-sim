import { useEffect, useState } from 'react';
import { AppShell, Button, Group } from '@mantine/core';
import { type World, type City } from './common/types';
import CityManager from './components/CityManager/CityManager';
import CityDashboard from './components/CityDashboard/CityDashboard';
import { useMessages } from './hooks/useMessages';
import { useInstallPrompt } from './hooks/useInstallPrompt';

import WorldTopBar from './components/WorldManager/WorldTopBar';
import WorldLobby from './components/WorldManager/WorldLobby';

import { parseSimulationWeights } from './services/configService';
import { setSimulationCoefficients } from './services/sim';

type ViewMode = 'LOBBY' | 'APP';

/**
 * Component to handle PWA installation.
 * Shows an "Install App" button if the browser supports PWA installation.
 * The button is only visible if:
 * - The app is not already installed
 * - The browser fired a beforeinstallprompt event
 */
const InstallAppButton: React.FC = () => {
    const { canInstall, installApp } = useInstallPrompt();
    const { showSuccess, showError, showWarning } = useMessages();
    const [isInstalling, setIsInstalling] = useState(false);

    const handleInstallClick = async () => {
        setIsInstalling(true);
        try {
            const outcome = await installApp();
            
            if (outcome === 'accepted') {
                // Check if Firefox
                const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
                if (isFirefox) {
                    showWarning('Firefox: Click the "+" button in the address bar to install, or use the menu. The app works fully offline!');
                } else {
                    showSuccess('App installed successfully! You can now use it offline.');
                }
            } else if (outcome === 'dismissed') {
                // User dismissed, no need to show error
                console.log('Install prompt dismissed by user');
            }
        } catch (error) {
            console.error('Installation failed:', error);
            showError('Failed to install app. Please try again.');
        } finally {
            setIsInstalling(false);
        }
    };

    // Only render if installation is possible
    if (!canInstall) {
        return null;
    }

    return (
        <Button
            onClick={handleInstallClick}
            disabled={isInstalling}
            loading={isInstalling}
            variant="light"
            size="xs"
        >
            {isInstalling ? 'Installing...' : 'Install App'}
        </Button>
    );
};

export default function App() {
    const [viewMode, setViewMode] = useState<ViewMode>('APP');
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

    /* ------------------------------------------------------------------
       MODE 1: APP BAR (The Productivity Look)
       ------------------------------------------------------------------ */
    if (viewMode === 'APP') {
        return (
            <AppShell header={{ height: { base: 120, sm: 60 } }}
                      padding={'md'}>
                <AppShell.Header>
                    <WorldTopBar
                        selectedWorld={selectedWorld}
                        onWorldSelect={handleWorldSelect}
                    />
                    
                    {/* CENTERED TOGGLE BUTTON */}
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}>
                        <InstallAppButton />
                        <Button
                            size={'xs'}
                            variant={'light'}
                            color={'gray'}
                            onClick={() => setViewMode('LOBBY')}
                        >
                            Try Lobby Mode
                        </Button>
                    </div>
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

    /* ------------------------------------------------------------------
       MODE 2: LOBBY (The Game Look)
       ------------------------------------------------------------------ */
    return (
        <>
            {/* If no world selected, show the Lobby Grid */}
            {selectedWorld ? (
                /* ... Dashboard View ... */
                <div style={{padding: 20}}>
                    <Group mb={'md'} justify={'space-between'}> {/* Use justify to
                     separate them */}
                        <Button onClick={() => setSelectedWorld(null)}>
                            ← Back to Lobby
                        </Button>
                        <Button onClick={() => setViewMode('APP')}>
                            Try App Mode
                        </Button>
                    </Group>

                    <CityManager
                        selectedWorld={selectedWorld}
                        selectedCity={selectedCity}
                        onCitySelect={setSelectedCity}
                    />
                    <CityDashboard cityId={selectedCity?.id || null}/>
                </div>
            ) : (
                <>
                    {/* CENTERED TOGGLE BUTTON */}
                    <div style={{
                        position: 'absolute',
                        top: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 100
                    }}>
                        <InstallAppButton/>
                        <Button onClick={() => setViewMode('APP')}>
                            Try App Mode
                        </Button>
                    </div>

                    <WorldLobby onWorldSelect={handleWorldSelect}/>
                </>
            )}
        </>
    );
}
