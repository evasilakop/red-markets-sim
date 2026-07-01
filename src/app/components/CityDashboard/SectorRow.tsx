import {type ActionType, type Sector} from '../../common/types';
import {EQUILIBRIUM_DEFINITIONS, SECTOR_DEFINITIONS, STAT_DEFINITIONS} from '../../common/tooltips';
import {formatPriceIndex, getEquilibriumDisplay} from '../../utils/displayUtils';
import HelpTooltip from '../common/HelpTooltip';
import ActionSelector from './ActionSelector';
import {Badge, Group, Progress, Stack, Table, Text} from '@mantine/core';

interface SectorRowProps {
    sector: Sector;
    onAction: (sectorId: string, action: ActionType, magnitude: number) => void;
    isBusy?: boolean;
}

export default function SectorRow({ sector, onAction, isBusy = false }: Readonly<SectorRowProps>) {
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
                <Group gap={'xs'} wrap={'nowrap'}>
                    <Text size={'sm'}>{sector.type}</Text>
                    <HelpTooltip label={SECTOR_DEFINITIONS[sector.type]} />
                </Group>
            </Table.Td>

            <Table.Td ta={'center'}>
                {renderBar(sector.supply, 'blue')}
            </Table.Td>

            <Table.Td>
                {renderBar(sector.demand, 'orange')}
            </Table.Td>

            <Table.Td ta={'center'}>
                <Group gap={'xs'} wrap={'nowrap'} justify={'center'}>
                    <Badge color={color} variant={'outline'} size={'lg'}>
                        {label}
                    </Badge>
                    <HelpTooltip label={EQUILIBRIUM_DEFINITIONS[sector.equilibrium]} />
                </Group>
            </Table.Td>

            <Table.Td>
                <Stack gap={2}>
                    <Group gap={8} wrap={'nowrap'}>
                        {/* Fixed width label (e.g., 45px) ensures alignment */}
                        <Text size={'xs'} c={'dimmed'} fw={700} w={45}>CHIPS</Text>
                        <HelpTooltip label={STAT_DEFINITIONS['CHIPS']} />
                        <Text size={'sm'} w={20} ta={'center'}>{sector.startingChips}</Text>
                    </Group>
                    <Group gap={8} wrap={'nowrap'}>
                        <Text size={'xs'} c={'dimmed'} fw={700} w={45}>COMP</Text>
                        <HelpTooltip label={STAT_DEFINITIONS['COMP']} />
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