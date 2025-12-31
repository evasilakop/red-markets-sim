import {useCityData} from '../../hooks/useCityData';
import {useSimWorker} from '../../hooks/useSimWorker';
import {db} from '../../services/db';
import {type ActionType, type SectorType, type UserAction} from '../../common/types';
import SectorRow from './SectorRow';
import {Button, Group, Paper, Table, Text, Title} from '@mantine/core';
import {useMessages} from '../../hooks/useMessages.ts';

interface CityDashboardProps {
    cityId: string | null;
}

export default function CityDashboard({cityId}: CityDashboardProps) {
    const data = useCityData(cityId);
    const {busy, tick, applyActions} = useSimWorker();
    const {showSuccess, showError} = useMessages();

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
            // transaction: all or nothing. Either everything is done or everything fails
            await db.transaction('rw', db.sectors, db.cities, async () => {
                await db.sectors.bulkPut(updatedSectors);
                await db.cities.update(data.city.id, {lastTick: Date.now()});
                showSuccess('World updated')
            });

        } catch (error) {
            console.error("Tick failed", error);
            showError('Error applying tick');
            // In a real app, you might use a toast/snackbar here (floaty message
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
            <Group justify={'space-between'} align={'center'} w={'100%'}>
                <Title order={2}>{city.name} Market</Title>
                <Group>
                    <Text size={'sm'} c={'dimmed'}>
                        Last Update: {new Date(city.lastTick).toLocaleTimeString()}
                    </Text>
                    <Button
                        onClick={handleTick}
                        loading={busy} // Disable while worker is thinking
                    >Advance Time (Tick)
                    </Button>
                </Group>
            </Group>

            {/* Main Sector Table */}
            <Table.ScrollContainer minWidth={500}>
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
                        {sectors.map(sector => (
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