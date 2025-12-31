import {type ActionType, type Sector} from '../../common/types';
import {formatPriceIndex, getEquilibriumDisplay} from '../../utils/displayUtils';
import ActionSelector from './ActionSelector';
import {Badge, Group, Progress, Stack, Table, Text} from '@mantine/core';

interface SectorRowProps {
    sector: Sector;
    onAction: (sectorId: string, action: ActionType, magnitude: number) => void;
    isBusy?: boolean;
}

export default function SectorRow({ sector, onAction, isBusy = false }: SectorRowProps) {
    const { label, color } = getEquilibriumDisplay(sector.equilibrium);

    // Helper to render the value + bar
    const renderBar = (value: number, barColor: string) => (
        <Group gap={'xs'} wrap={'nowrap'}>
            {/* The Number */}
            <Text size={'sm'} w={24} ta={'right'}>{value}</Text>

            {/* The Bar */}
            <Progress
                value={value}
                color={barColor}
                size={'md'}
                radius={'xl'}
                style={{ flex: 1 }} // Take up remaining space
                visibleFrom={'md'}  // only visible when there is enough screen space
                aria-hidden={'true'}
            />
        </Group>
    );

    /*
    =====================================================================
                                Render
    =====================================================================
    */
    return (
        <Table.Tr>
            <Table.Td fw={700} width={150} >
                {sector.type}
            </Table.Td>

            <Table.Td ta={'center'}>
                {renderBar(sector.supply, 'blue')}
            </Table.Td>

            <Table.Td>
                {renderBar(sector.demand, 'orange')}
            </Table.Td>

            <Table.Td ta={'center'}>
                <Badge color={color} variant={'outline'} size={'lg'}>
                    {label}
                </Badge>
            </Table.Td>

            <Table.Td>
                <Stack gap={2}>
                    <Group gap={8} wrap={'nowrap'} title={'Starting Chips'}>
                        {/* Fixed width label (e.g., 45px) ensures alignment */}
                        <Text size={'xs'} c={'dimmed'} fw={700} w={45}>CHIPS</Text>
                        <Text size={'sm'} w={20} ta={'center'}>{sector.startingChips}</Text>
                    </Group>
                    <Group gap={8} wrap={'nowrap'} title={'Competition Dice'}>
                        <Text size={'xs'} c={'dimmed'} fw={700} w={45}>COMP</Text>
                        <Text size={'sm'} w={20} ta={'center'}>{sector.competitionUndercutDice}</Text>
                    </Group>
                </Stack>
            </Table.Td>

            <Table.Td ta={'center'}>
                <Text fw={500}>
                    {formatPriceIndex(sector.priceIndex)}
                </Text>
            </Table.Td>

            <Table.Td width={'380'}>
                <ActionSelector
                    onApply={(action, mag) => onAction(sector.id, action, mag)}
                    disabled={isBusy}
                />
            </Table.Td>
        </Table.Tr>
    );
}