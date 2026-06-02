import {useState, useEffect} from 'react';
import {useCityData} from '../../hooks/useCityData';
import {useSimWorker} from '../../hooks/useSimWorker';
import {useMessages} from '../../hooks/useMessages.ts';
import {db} from '../../services/db';
import {type ActionType, type SectorType, type UserAction, isCityV2} from '../../common/types';
import SectorRow from './SectorRow';
import {Button, Group, Paper, Table, Text, Title, Slider, Badge, Stack} from '@mantine/core';
import {IconSettings, IconUsers, IconShield, IconMicroscope} from '@tabler/icons-react';

interface CityDashboardProps {
    cityId: string | null;
}

export default function CityDashboard({cityId}: Readonly<CityDashboardProps>) {
    const data = useCityData(cityId);
    const {busy, tick, applyActions} = useSimWorker();
    const {showSuccess, showError} = useMessages();
    const [visibleRows, setVisibleRows] = useState(10);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (data?.city) {
            console.log('DEBUG: Current City Data:', data.city);
            console.log('DEBUG: Is it CityV2?:', isCityV2(data.city));
        }
    }, [data]);

    /*
    =====================================================================
                              Event handlers
    =====================================================================
     */

    /**
     * Advances the simulation time by one tick for all sectors in the current city.
     * Wraps the worker calculation and the database update in a single transaction.
     */
    const handleTick = async () => {
        if (!data || busy) return;

        try {
            // A. Calculate new state in Worker
            const updatedSectors = await tick(data.sectors);

            // B. Save to DB (React will auto-update because of useCityData)
            // We also update the City's lastTick timestamp
            await db.transaction('rw', db.sectors, db.cities, async () => {
                await db.sectors.bulkPut(updatedSectors);
                await db.cities.update(data.city.id, {lastTick: Date.now()});
                showSuccess('World updated')
            });

        } catch (error) {
            console.error("Tick failed", error);
            showError('Error applying tick');
            // In a real app, you might want to use a toast/snackbar here (floaty message
            // thingy, maybe add this to message service)
        }
    };

    /**
     * Applies a specific user action to a sector.
     * Sends the request to the worker for calculation and persists the result to the DB.
     *
     * @param sectorId - The ID of the target sector.
     * @param actionType - The type of action to perform (e.g., MARKET, SABOTAGE).
     * @param magnitude - The intensity of the action (0-10).
     */
    const handleAction = async (sectorId: string, actionType: ActionType, magnitude: number) => {
        if (!data || busy) return;
        // Find the specific sector to get its type
        const sector = data.sectors.find(s => s.id === sectorId);
        if (!sector) return;

        try {
            // Construct the action object
            const actionsMap: Record<SectorType, UserAction[]> = {
                [sector.type]: [{
                    sector: sector.type,
                    type: actionType,
                    magnitude: magnitude
                }]
            } as Record<SectorType, UserAction[]>;

            const updatedSectors = await applyActions(data.sectors, actionsMap);
            await db.sectors.bulkPut(updatedSectors);

        } catch (error) {
            console.error("Action failed", error);
            showError('Error applying action');
        }
    };

    if (!cityId) return null;
    if (data === undefined) return <Group>Loading market data...</Group>;
    if (data === null) return <Group>City not found.</Group>;
    const {city, sectors} = data;

    /*
    =====================================================================
                                Render
    =====================================================================
    */
    return (
        <Paper shadow={'xs'} p={'md'} withBorder m={'md'}>
            {/* Header Section */}
            <Group justify={'space-between'} align={'start'} w={'100%'}>
                <Stack gap={0}>
                    <Group justify={'left'} align={'center'}>
                        <Title order={2}>{city.name} Market</Title>
                        <Button
                            variant={'subtle'}
                            color={'gray'}
                            onClick={() => setShowSettings(!showSettings)}
                            aria-label={'City Dashboard Settings'}
                            size={'compact-xs'}
                        >
                            <IconSettings size={20} />
                        </Button>
                        {showSettings && (
                            <Group gap={'xs'} wrap={'nowrap'} align={'center'}>
                                <Text size={'xs'} c={'dimmed'}>Table Size</Text>
                                <Slider
                                    value={visibleRows}
                                    onChange={setVisibleRows}
                                    min={2}
                                    max={10}
                                    step={1}
                                    w={150}
                                    aria-label={'Adjust visible rows'}
                                />
                            </Group>
                        )}
                    </Group>

                    {/*  City Stats Overview */}
                    <Group gap={'xs'} mt={'xs'}>
                        {isCityV2(city) ? (
                            <>
                                <Group gap={5}>
                                    <IconUsers size={16} color={'gray'} />
                                    <Text size={'sm'} c={'dimmed'}>{city.population.toLocaleString()}</Text>
                                </Group>
                                <Group gap={5}>
                                    <IconMicroscope size={16} color={'gray'} />
                                    <Badge variant={'light'} size={'sm'}>{city.techLevel}</Badge>
                                </Group>
                                <Group gap={5}>
                                    <IconShield size={16} color={'gray'} />
                                    <Text size={'sm'} c={'dimmed'}>{city.defense}</Text>
                                </Group>
                            </>
                        ) : (
                            <Text size={'xs'} c={'dimmed'}>Legacy City (Stats unavailable)</Text>
                        )}
                    </Group>
                </Stack>

                <Group>

                    <Text size={'sm'} c={'dimmed'}>
                        Last Update: {new Date(city.lastTick).toLocaleTimeString()}
                    </Text>
                    <Button
                        onClick={handleTick}
                        loading={busy} // Disable while worker is thinking
                    >
                        Advance Time (Tick)
                    </Button>
                </Group>
            </Group>

            {/* Main Sector Table */}
            <Table.ScrollContainer minWidth={500} mt={'md'}>
                <Table striped highlightOnHover={true} stickyHeader
                       withRowBorders={false}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th ta={'center'}>Sector</Table.Th>
                            <Table.Th ta={'center'}>Supply</Table.Th>
                            <Table.Th ta={'center'}>Demand</Table.Th>
                            <Table.Th ta={'center'}>State</Table.Th>
                            <Table.Th ta={'center'}>Stats</Table.Th>
                            <Table.Th ta={'center'}>Price</Table.Th>
                            <Table.Th ta={'center'}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sectors.slice(0, visibleRows).map(sector => (
                            <SectorRow
                                key={sector.id}
                                sector={sector}
                                onAction={handleAction}
                                isBusy={busy} // Pass busy state down to disable inputs
                            />
                        ))}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Paper>
    );
}
