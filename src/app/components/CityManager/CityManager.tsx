import {useCallback, useEffect, useState} from 'react';
import {addCity, listCities, removeCity} from '../../services/worldService.ts';
import type {City, World} from '../../common/types.ts';
import {useMessages} from '../../hooks/useMessages.ts';
import {Button, Group, Paper, Stack, Text, TextInput, Title} from '@mantine/core';
import {modals} from '@mantine/modals';

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
                                    }: CityManagerProps) {
    const {showSuccess, showError} = useMessages();
    const [isDeleting, setIsDeleting] = useState(false);
    const [cities, setCities] = useState<City[]>([]);

    const refreshCities = useCallback(async (worldId: string, isActive: boolean) => {
        try {
            const cs = await listCities(worldId);
            if (isActive) {
                setCities(cs);
                if (!selectedCity && cs.length > 0) {
                    onCitySelect(cs[0]);
                }
            }
        } catch (error) {
            if (isActive) {
                console.error("Failed to load cities", error);
                showError("Failed to load cities");
            }
        }
    }, [onCitySelect, selectedCity, showError]);

    // Handle World Changes safely
    useEffect(() => {
        let active = true;
        if (selectedWorld) {
            refreshCities(selectedWorld.id, active);
        } else {
            setCities([]);
            onCitySelect(null);
        }
        return () => {
            active = false;
        };
    }, [selectedWorld, refreshCities]);

    /*
    =====================================================================
                              Event handlers
    =====================================================================
     */
    /**
     * Creates a new city in the currently selected world and updates the list.
     * Auto-selects the newly created city.
     */
    const handleAddCity = () => {
        if (!selectedWorld) return;

        // 1. Create a variable to hold the value
        let nameInput = '';

        modals.openConfirmModal({
            title: "Add City",
            centered: true,
            children: (
                <TextInput
                    label={'Enter a name for the new city:'}
                    placeholder={'City name'}
                    data-autofocus
                    // Capture the user's typing
                    onChange={(e) => { nameInput = e.currentTarget.value; }}
                />
            ),
            labels: { confirm: 'Create', cancel: 'Cancel' },
            confirmProps: { color: 'green' },

            // Move the logic INSIDE here
            onConfirm: async () => {
                const finalName = nameInput.trim() || 'New City';

                try {
                    const { city } = await addCity(selectedWorld.id, finalName);
                    await refreshCities(selectedWorld.id, true);
                    onCitySelect(city);
                } catch (e) {
                    showError("Could not create city");
                }
            }
        });
    };

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
                <Text size={"sm"}>
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
                await refreshCities(selectedWorld.id, true);
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
                        <Title order={3}>Cities in {selectedWorld.name}</Title>
                        <Group>
                            <Button size={'compact-lg'}
                                    color={'green'}
                                    variant={'filled'}
                                    onClick={handleAddCity}>
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

                    {cities.length > 0 ? (
                        <Group>
                            {cities.map(city => (
                                <Button size={'xs'}
                                        variant={selectedCity?.id === city.id ? 'filled' : 'outline'}
                                        color={'teal'}
                                        key={city.id}
                                        onClick={() => onCitySelect(city)}
                                >
                                    {city.name}
                                </Button>
                            ))}
                        </Group>
                    ) : (
                        <Text>
                            No cities yet. Add one to get started!
                        </Text>
                    )}
                </Stack>
            )}
        </Paper>
    );
}