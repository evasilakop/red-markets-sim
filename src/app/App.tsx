import { useState } from 'react';
import { AppShell, Button, Group } from '@mantine/core';
import { type World, type City } from './common/types';
import CityManager from './components/CityManager/CityManager';
import CityDashboard from './components/CityDashboard/CityDashboard';

import WorldTopBar from './components/WorldManager/WorldTopBar';
import WorldLobby from './components/WorldManager/WorldLobby';

type ViewMode = 'LOBBY' | 'APP';

export default function App() {
    const [viewMode] = useState<ViewMode>('APP');
    const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

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
                    }}> {/*
                        <Button
                            size={'xs'}
                            variant={'light'}
                            color={'gray'}
                            onClick={() => setViewMode('LOBBY')}
                        >
                            Try Lobby Mode
                        </Button>*/}
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
            {!selectedWorld ? (
                <>
                    {/* CENTERED TOGGLE BUTTON */}
                    {/*<div style={{
                        position: 'absolute',
                        top: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 100
                    }}>
                        <Button onClick={() => setViewMode('APP')}>
                            Try App Mode
                        </Button>
                    </div>
*/}
                    <WorldLobby onWorldSelect={handleWorldSelect} />
                </>
            ) : (
                /* ... Dashboard View ... */
                <div style={{ padding: 20 }}>
                    <Group mb={'md'} justify={'space-between'}> {/* Use justify to
                     separate them */}
                        <Button onClick={() => setSelectedWorld(null)}>
                            ← Back to Lobby
                        </Button>

                        {/* Center the toggle here too? or keep it right?
                        <Button onClick={() => setViewMode('APP')}>
                            Try App Mode
                        </Button>
                        */}
                    </Group>

                    <CityManager
                        selectedWorld={selectedWorld}
                        selectedCity={selectedCity}
                        onCitySelect={setSelectedCity}
                    />
                    <CityDashboard cityId={selectedCity?.id || null} />
                </div>
            )}
        </>
    );
}