import { useEffect, useState } from 'react';
import { Modal, Stepper, Button, Group, Stack, Text, Divider, Table, Title, Badge } from '@mantine/core';
import { type City, type SectorType, ALL_SECTORS } from '../../common/types';
import { addCity } from '../../services/cityService';
import CityBasicInfoForm from '../CityDashboard/CityBasicInfoForm';
import SectorConfigGrid from './SectorConfigGrid';
import { chipsFor, deriveEquilibrium } from '../../services/sim';
import { useMessages } from '../../hooks/useMessages';

interface AddCityWizardProps {
    opened: boolean;
    onClose: () => void;
    onCreated: () => void;
    worldId: string;
}

const DEFAULT_CITY_INFO: Partial<City> = {
    population: 1000,
    techLevel: 'Industrial',
    defense: 10,
};

/**
 * Builds the default supply/demand map for all sectors (50/50 baseline).
 */
function createDefaultCustomSectors(): Record<SectorType, { supply: number; demand: number }> {
    return ALL_SECTORS.reduce(
        (acc, type) => ({ ...acc, [type]: { supply: 50, demand: 50 } }),
        {} as Record<SectorType, { supply: number; demand: number }>
    );
}

/**
 * Multistep wizard for creating a new city.
 * Allows GMs to define basic stats and choose between random or custom sector values.
 */
export default function AddCityWizard({ opened, onClose, onCreated, worldId }: Readonly<AddCityWizardProps>) {
    const { showSuccess, showError } = useMessages();
    const [activeStep, setActiveStep] = useState(0);
    const [mode, setMode] = useState<'random' | 'custom'>('random');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [cityInfo, setCityInfo] = useState<Partial<City>>(DEFAULT_CITY_INFO);

    const [customSectors, setCustomSectors] = useState(createDefaultCustomSectors);

    /** Resets wizard state whenever the modal is opened. */
    useEffect(() => {
        if (opened) {
            setActiveStep(0);
            setMode('random');
            setIsSubmitting(false);
            setCityInfo(DEFAULT_CITY_INFO);
            setCustomSectors(createDefaultCustomSectors());
        }
    }, [opened]);

    const handleNext = () => {
        if (mode === 'random') {
            setActiveStep(2);
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (activeStep === 2 && mode === 'random') {
            setActiveStep(0);
        } else {
            setActiveStep(prev => prev - 1);
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await addCity(worldId, cityInfo, mode === 'custom' ? customSectors : undefined);
            showSuccess(`City "${cityInfo.name?.trim() || 'Untitled'}" created!`);
            onCreated();
            onClose();
        } catch (error) {
            console.error('Create city failed:', error);
            showError('Failed to create city. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={'Add New City'} size={'lg'}>
            <Stepper active={activeStep}>
                <Stepper.Step label={'Basic Info'} description={'Name and stats'}>
                    <Stack gap={'md'} mt={'md'}>
                        <CityBasicInfoForm
                            values={cityInfo}
                            onChange={(updates) => setCityInfo(prev =>
                                ({ ...prev, ...updates }))}
                        />
                        <Divider label={'Economy Mode'} my={'md'} />
                        <Group>
                            <Button
                                variant={mode === 'random' ? 'filled' : 'outline'}
                                onClick={() => setMode('random')}
                            >
                                Random Sectors
                            </Button>
                            <Button
                                variant={mode === 'custom' ? 'filled' : 'outline'}
                                onClick={() => setMode('custom')}
                            >
                                Custom Sectors
                            </Button>
                        </Group>
                        <Group justify={'flex-end'} mt={'xl'}>
                            <Button variant={'default'} onClick={onClose}>Cancel</Button>
                            <Button onClick={handleNext} disabled={!cityInfo.name?.trim()}>Next</Button>
                        </Group>
                    </Stack>
                </Stepper.Step>

                <Stepper.Step label={'Sector Values'} description={'Supply and Demand'}>
                    <Stack gap={'md'} mt={'md'}>
                        <Text size={'sm'} c={'dimmed'}>
                            Configure the supply and demand for each sector to set the initial economic state.
                        </Text>
                        <SectorConfigGrid
                            values={customSectors}
                            onChange={(type, updates) =>
                                setCustomSectors(prev => ({
                                ...prev,
                                [type]: { ...prev[type], ...updates },
                            }))}
                        />
                        <Group justify={'flex-end'} mt={'xl'}>
                            <Button variant={'default'} onClick={handleBack}>Back</Button>
                            <Button onClick={handleNext}>Next</Button>
                        </Group>
                    </Stack>
                </Stepper.Step>

                <Stepper.Step label={'Review'} description={'Final confirmation'}>
                    <Stack gap={'md'} mt={'md'}>
                        <Title order={5}>City Details</Title>
                        <Text size={'sm'}>
                            <strong>Name:</strong> {cityInfo.name || 'Untitled'}<br />
                            <strong>Population:</strong> {cityInfo.population?.toLocaleString()}<br />
                            <strong>Tech Level:</strong> {cityInfo.techLevel}<br />
                            <strong>Defense:</strong> {cityInfo.defense}<br />
                            <strong>Economy Mode:</strong> {mode === 'random' ? 'Random Sectors' : 'Custom Sectors'}
                        </Text>
                        {cityInfo.notes && (
                            <Text size={'sm'}><strong>Notes:</strong> {cityInfo.notes}</Text>
                        )}
                        {(cityInfo.exports?.length ?? 0) > 0 && (
                            <Group gap={'xs'}>
                                <Text size={'sm'} fw={700}>Exports:</Text>
                                {cityInfo.exports!.map(tag => (
                                    <Badge key={tag} size={'sm'} variant={'light'}>{tag}</Badge>
                                ))}
                            </Group>
                        )}
                        {(cityInfo.imports?.length ?? 0) > 0 && (
                            <Group gap={'xs'}>
                                <Text size={'sm'} fw={700}>Imports:</Text>
                                {cityInfo.imports!.map(tag => (
                                    <Badge key={tag} size={'sm'} variant={'light'}>{tag}</Badge>
                                ))}
                            </Group>
                        )}

                        <Divider label={'Sector Economy'} my={'md'} />
                        {mode === 'random' ? (
                            <Text size={'sm'} c={'dimmed'}>
                                Sectors will be randomly generated with supply and demand between 45 and 55.
                            </Text>
                        ) : (
                            <Table verticalSpacing={'xs'}>
                                <thead>
                                    <tr>
                                        <th>Sector</th>
                                        <th>S/D</th>
                                        <th>Equilibrium</th>
                                        <th>Derived</th>
                                    </tr>
                                </thead>
                                <tbody>
                                  {ALL_SECTORS.map(type => {
                                      const isCustom = mode === 'custom';
                                      const s = isCustom ? customSectors[type] : { supply: 50, demand: 50 };
                                      const eq = deriveEquilibrium(s.supply, s.demand);
                                      // noinspection SpellCheckingInspection
                                      return (
                                          <tr key={type}>
                                              <Table.Td>
                                                  <Text size={'sm'}>{type}</Text>
                                              </Table.Td>
                                              <Table.Td>
                                                  <Text size={'sm'}>{isCustom ? `${s.supply}/${s.demand}` : 'Random'}</Text>
                                              </Table.Td>
                                              <Table.Td>
                                                  <Stack gap={2}>
                                                      <Group gap={8} wrap={'nowrap'} title={'Equilibrium'}>
                                                          <Text size={'xs'} c={'dimmed'} fw={700} w={45}>EQUIL</Text>
                                                          <Text size={'sm'} w={80} ta={'left'}>{isCustom ? eq : 'Random'}</Text>
                                                      </Group>
                                                  </Stack>
                                              </Table.Td>
                                              <Table.Td>
                                                  <Stack gap={2}>
                                                      <Group gap={8} wrap={'nowrap'} title={'Starting Chips'}>
                                                          <Text size={'xs'} c={'dimmed'} fw={700} w={45}>CHIPS</Text>
                                                          <Text size={'sm'} w={20} ta={'center'}>{isCustom ? chipsFor(eq) : 'Random'}</Text>
                                                      </Group>
                                                  </Stack>
                                              </Table.Td>
                                          </tr>
                                      );
                                  })}
                                </tbody>
                            </Table>
                        )}

                        <Group justify={'flex-end'} mt={'xl'}>
                            <Button variant={'default'} onClick={handleBack} disabled={isSubmitting}>Back</Button>
                            <Button color={'green'} onClick={handleConfirm} loading={isSubmitting}>
                                Confirm & Create City
                            </Button>
                        </Group>
                    </Stack>
                </Stepper.Step>
            </Stepper>
        </Modal>
    );
}
