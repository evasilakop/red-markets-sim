import {useEffect, useState} from 'react';
import {removeCity, listCities} from '../../services/cityService.ts';
import type {City, World} from '../../common/types.ts';
import {useMessages} from '../../hooks/useMessages.ts';
import {Button, Chip, Group, Paper, Stack, Text, Title} from '@mantine/core';
import {modals} from '@mantine/modals';
import {useLiveQuery} from 'dexie-react-hooks';
import AddCityWizard from './AddCityWizard';

/**
 * Props for the CityManager component.
 */
interface CityManagerProps {
    /* The currently selected world, or null if none selected */
    selectedWorld: World | null;
    /* The currently selected city, or null if none selected */
    selectedCity: City | null;
    /* Callback invoked when user selects a different city (or clears selection) */
    onCitySelect: (city: City | null) => void;
}

/**
 *
 * React component for managing cities within the selected world.
 * Supports listing, selecting, creating, and removing cities,
 * and provides user feedback via scoped messages.
 * @param props Component props
 * @returns The rendered CityManager component
 */
export default function CityManager({
                                         selectedWorld,
                                         selectedCity,
                                         onCitySelect
                                     }: Readonly<CityManagerProps>) {
    const {showSuccess, showError} = useMessages();
    const [isDeleting, setIsDeleting] = useState(false);
    const [wizardOpened, setWizardOpened] = useState(false);

    // Reactive subscription to cities in the selected world
    const cities = useLiveQuery(
        async () => {
            if (!selectedWorld) return [];
            return await listCities(selectedWorld.id);
        },
        [selectedWorld?.id]
    );

    // Synchronize selection when cities list changes (e.g. auto-select first city)
    useEffect(() => {
        if (cities && selectedWorld && !selectedCity && cities.length > 0) {
            onCitySelect(cities[0]);
        } else if (cities && !selectedWorld) {
            onCitySelect(null);
        }
    }, [cities, selectedWorld, selectedCity, onCitySelect]);

    /*
    =====================================================================
                                Event handlers
    =====================================================================
    */
    /**
     * Triggers the confirmation dialog for city deletion.
     * Validates that a city and world are currently selected.
     */
    const handleRemoveCity = () => {
        if (!selectedCity || !selectedWorld) return;

        modals.openConfirmModal({
            title: 'Delete City',
            centered: true,
            children: (
                <Text size={'sm'}>
                    Are you sure you want to delete <strong>{selectedCity.name}</strong>?
                    This will remove all sectors. This action cannot be undone.
                </Text>
            ),
            labels: {confirm: 'Delete City', cancel: 'Cancel'},
            confirmProps: {color: 'red'},
            onConfirm: () => confirmDeleteCity()
        });
    };

    /**
     * Executes the deletion of the selected city and all its associated sectors.
     * Updates the UI state, clears the selection, and refreshes the list on success.
     * Handles errors by displaying a user-friendly message.
     */
    const confirmDeleteCity = async () => {
        if (!selectedCity || !selectedWorld) return;
        setIsDeleting(true);

        try {
            const result = await removeCity(selectedCity.id);
            if (result.success) {
                showSuccess(result.message || 'City deleted!');
                onCitySelect(null);
            } else {
                console.error(result.error);
                showError(result.error?.toString() as string);
            }
        } catch (error) {
            console.error('Delete city failed:', error);
            showError('Delete city failed. Check console for details.');
        } finally {
            setIsDeleting(false);
        }
    };

    /*
    =====================================================================
                                 Render
    =====================================================================
    */
    return (
        <Paper shadow={'xs'} p={'md'} withBorder m={'md'}>
            {selectedWorld && (
                <Stack>
                    <Group justify={'space-between'}>
                        <Title order={2}>Cities in {selectedWorld.name}</Title>
                        <Group>
                            <Button size={'compact-lg'}
                                    color={'green.9'}
                                    c={'white'}
                                    variant={'filled'}
                                    onClick={() => setWizardOpened(true)}>
                                Add City
                            </Button>
                            {selectedCity && (
                                <Button size={'compact-lg'}
                                        color={'red'}
                                        variant={'filled'}
                                        onClick={handleRemoveCity}
                                        disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Remove City'}
                                </Button>
                            )}
                        </Group>
                    </Group>

                    {cities && cities.length > 0 ? (
                        <Group>
                            <Chip.Group
                                multiple={false}
                                value={selectedCity?.id}
                                onChange={(val) => {
                                    if (!val) return; // doesn't allow deselection
                                    const city = cities.find(c => c.id === val);
                                    if (city) onCitySelect(city);
                                }}
                            >
                                {cities.map(city => (
                                    <Chip key={city.id}
                                            value={city.id}
                                            size={'sm'}
                                            color={'cyan'}
                                      >
                                        {city.name}
                                    </Chip>
                                ))}
                            </Chip.Group>
                        </Group>
                    ) : (
                        <Text>
                            No cities yet. Add one to get started!
                        </Text>
                    )}
                </Stack>
            )}
            <AddCityWizard 
                opened={wizardOpened} 
                onClose={() => setWizardOpened(false)} 
                onCreated={() => {
                    setWizardOpened(false);
                }}
                worldId={selectedWorld?.id || ''}
            />
        </Paper>
    );
}
