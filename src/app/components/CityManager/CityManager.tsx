import {useEffect, useState} from 'react';
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

    useEffect(() => {
        if (selectedWorld) {
            refreshCities(selectedWorld.id);
        } else {
            onCitiesChange([]);
            onCitySelect(null);
        }
    }, [selectedWorld]);

    /*
       =====================================================================
                                 Helper functions
       =====================================================================
    */

    /**
     * Loads cities for the given world and updates parent state.
     * Auto-selects the first city if none is currently selected.
     * @param worldId The ID of the world whose cities should be loaded
     * <p/>
     * <p>Why refresh instead of just adding to state? </p>
     * <p>   Single source of truth: Database is authoritative </p>
     * <p>   Consistency: Ensures UI matches database exactly </p>
     * <p>   Simplicity: Same logic for all city list updates</p>
     */
    async function refreshCities(worldId: string) {
        try {
            const cs = await listCities(worldId);
            onCitiesChange(cs);
            if (!selectedCity && cs.length > 0) {
                onCitySelect(cs[0]);
            }
        } catch (error) {
            console.error("Failed to load cities", error);
            showError("Failed to load cities");
        }
    }

    /*
       =====================================================================
                                 Event Handlers
       =====================================================================
     */

    /**
     * Creates a new city in the currently selected world and updates the list.
     * Auto-selects the newly created city.
     */
    const handleAddCity = async () => {
        if (!selectedWorld) return;
        const name = prompt('City name:') || 'New City';
        const {city} = await addCity(selectedWorld.id, name);
        await refreshCities(selectedWorld.id);
        onCitySelect(city);
    };

    const handleRemoveCity = () => {
        if (!selectedCity || !selectedWorld) return;
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedCity || !selectedWorld) return;
        setShowConfirm(false);
        setIsDeleting(true);

        try {
            const result = await removeCity(selectedCity.id);
            if (result.success) {
                console.log(result.message);
                onCitySelect(null);
                await refreshCities(selectedWorld.id);
                showSuccess('City deleted!');
            } else {
                console.error(result.error);
                showError(result.error?.toString() as string);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            showError('Delete failed. Check console for details.');
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDelete = () => {
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
                                {isDeleting ? 'Deleting...' : 'Remove City'} {/* Added loading text */}
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

            {/* Fixed: use showConfirm instead of showDeleteConfirm */}
            {showConfirm && selectedCity && (
                <ConfirmationDialog
                    message={`Delete city "${selectedCity.name}"? This will remove all sectors. This cannot be undone.`}
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </>
    );
}