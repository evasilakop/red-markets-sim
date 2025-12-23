import {useEffect, useState, useCallback} from 'react';
import {addCity, listCities, removeCity} from "../../services/worldService.ts";
import type {City, World} from "../../common/types.ts";
import {useMessages} from "../../hooks/useMessages.ts";
import MessageDisplay from "../MessageDisplay/MessageDisplay.tsx";
import ConfirmationDialog from "../../common/ConfirmationDialog.tsx";
import './CityManager.css';

/**
 * Props for the CityManager component.
 */
interface CityManagerProps {
    /* The currently selected world, or null if none selected */
    selectedWorld: World | null;
    /* List of cities belonging to the selected world */
    cities: City[];
    /* The currently selected city, or null if none selected */
    selectedCity: City | null;
    /* Callback invoked when user selects a different city (or clears selection) */
    onCitySelect: (city: City | null) => void;
    /* Callback invoked when the list of cities changes (e.g., add/remove/refresh) */
    onCitiesChange: (cities: City[]) => void;
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
                                    cities,
                                    selectedCity,
                                    onCitySelect,
                                    onCitiesChange
                                    }: CityManagerProps) {
    const {showSuccess, showError} = useMessages('city');
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Memoize refreshCities so it doesn't break useEffect dependencies
    const refreshCities = useCallback(async (worldId: string, isActive: boolean) => {
        try {
            const cs = await listCities(worldId);
            // CRITICAL: Only update state if this request is still "active"
            if (isActive) {
                onCitiesChange(cs);
                // Only auto-select if we don't have a valid selection
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
    }, [onCitiesChange, onCitySelect, selectedCity, showError]);

    // Handle World Changes safely
    useEffect(() => {
        let active = true; // Flag to track if this effect is still valid

        if (selectedWorld) {
            refreshCities(selectedWorld.id, active);
        } else {
            onCitiesChange([]);
            onCitySelect(null);
        }

        // Cleanup function runs when selectedWorld changes or component unmounts
        return () => {
            active = false;
        };
    }, [selectedWorld, refreshCities]); // Proper dependencies

    /**
     * Creates a new city in the currently selected world and updates the list.
     * Auto-selects the newly created city.
     */
    const handleAddCity = async () => {
        if (!selectedWorld) return;
        const name = prompt('City name:') || 'New City';
        try {
            const {city} = await addCity(selectedWorld.id, name);
            // We pass 'true' because we know we want this update
            await refreshCities(selectedWorld.id, true);
            onCitySelect(city);
        } catch (e) {
            showError("Could not create city");
        }
    };

    const handleRemoveCity = () => {
        if (!selectedCity || !selectedWorld) return;
        setShowConfirm(true);
    };

    const confirmDeleteCity = async () => {
        if (!selectedCity || !selectedWorld) return;
        setShowConfirm(false);
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

    const cancelDeleteCity = () => {
        setShowConfirm(false);
    };

    return (
        <>
            {selectedWorld && (
                <section className="section">
                    <h3>Cities in {selectedWorld.name}</h3>
                    <MessageDisplay scope='city'/>
                    <div className='flex-row'>
                        <button onClick={handleAddCity} className="btn btn-primary">
                            Add City
                        </button>
                        {selectedCity && (
                            <button
                                onClick={handleRemoveCity}
                                className="btn btn-danger"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Remove City'}
                            </button>
                        )}
                    </div>

                    {cities.length > 0 ? (
                        <div className="city-list">
                            {cities.map(city => (
                                <button
                                    key={city.id}
                                    className={`city-list-item${selectedCity?.id === city.id ? ' selected' : ''}`}
                                    onClick={() => onCitySelect(city)}
                                    type="button"
                                    title={city.name}
                                >
                                    {city.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="city-empty-state">
                            No cities yet. Add one to get started!
                        </p>
                    )}
                </section>
            )}
            {showConfirm && selectedCity && (
                <ConfirmationDialog
                    message={`Delete city "${selectedCity.name}"? This will remove all sectors. This cannot be undone.`}
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    onConfirm={confirmDeleteCity}
                    onCancel={cancelDeleteCity}
                />
            )}
        </>
    );
}