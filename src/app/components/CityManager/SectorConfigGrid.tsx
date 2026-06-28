import { Table, NumberInput, Text, Group, Stack } from '@mantine/core';
import { ALL_SECTORS, type SectorType } from '../../common/types';
import { deriveEquilibrium, chipsFor, competitionDiceFor } from '../../services/sim';
import { MAX_SUPPLY, MIN_SUPPLY } from '../../common/constants';

interface SectorValues {
    supply: number;
    demand: number;
}

interface SectorConfigGridProps {
    values: Record<SectorType, SectorValues>;
    onChange?: (type: SectorType, updates: Partial<SectorValues>) => void;
    readOnly?: boolean;
}

/**
 * Parses a NumberInput value into a clamped supply/demand integer.
 */
function parseSectorValue(val: string | number): number | null {
    if (val === '' || val == null) return null;
    const num = Number(val);
    if (!Number.isFinite(num)) return null;
    return Math.max(MIN_SUPPLY, Math.min(MAX_SUPPLY, num));
}

/**
 * Grid for configuring supply and demand for all city sectors.
 * Provides real-time equilibrium, chips, and competition preview.
 */
export default function SectorConfigGrid({ values, onChange, readOnly = false }: Readonly<SectorConfigGridProps>) {
    return (
        <Table striped highlightOnHover verticalSpacing={'sm'}>
            <thead>
                <tr>
                    <th>Sector</th>
                    <th>Supply (0-100)</th>
                    <th>Demand (0-100)</th>
                    <th>Equilibrium</th>
                    <th>Derived</th>
                </tr>
            </thead>
            <tbody>
                {ALL_SECTORS.map((type) => {
                    const sector = values[type] || { supply: 50, demand: 50 };
                    const equilibrium = deriveEquilibrium(sector.supply, sector.demand);
                    const chips = chipsFor(equilibrium);
                    const competition = competitionDiceFor(equilibrium);

                    return (
                        <tr key={type}>
                            <td>
                                <Text fw={500} size={'sm'}>{type}</Text>
                            </td>
                            <td>
                                {readOnly ? (
                                    <Text size={'sm'}>{sector.supply}</Text>
                                ) : (
                                    <NumberInput
                                        size={'xs'}
                                        value={sector.supply}
                                        onChange={(val) => {
                                            const parsed = parseSectorValue(val);
                                            if (parsed !== null) onChange?.(type, { supply: parsed });
                                        }}
                                        min={0}
                                        max={100}
                                    />
                                )}
                            </td>
                            <td>
                                {readOnly ? (
                                    <Text size={'sm'}>{sector.demand}</Text>
                                ) : (
                                    <NumberInput
                                        size={'xs'}
                                        value={sector.demand}
                                        onChange={(val) => {
                                            const parsed = parseSectorValue(val);
                                            if (parsed !== null) onChange?.(type, { demand: parsed });
                                        }}
                                        min={0}
                                        max={100}
                                    />
                                )}
                            </td>
                            <Table.Td>
                                <Text size={'sm'}>{equilibrium}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Stack gap={2}>
                                    <Group gap={8} wrap={'nowrap'} title={'Starting Chips'}>
                                        <Text size={'xs'} c={'dimmed'} fw={700} w={45}>CHIPS</Text>
                                        <Text size={'sm'} w={20} ta={'center'}>{chips}</Text>
                                    </Group>
                                    <Group gap={8} wrap={'nowrap'} title={'Competition Dice'}>
                                        <Text size={'xs'} c={'dimmed'} fw={700} w={45}>COMP</Text>
                                        <Text size={'sm'} w={20} ta={'center'}>{competition}</Text>
                                    </Group>
                                </Stack>
                            </Table.Td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}
