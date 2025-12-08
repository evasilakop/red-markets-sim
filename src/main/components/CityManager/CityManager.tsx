// Load cities when world changes
import {useEffect} from "react";
import {addCity, listCities} from "../../services/worldService.ts";
import type {World, City} from "../../common/types.ts";

interface CityManagerProps {
    selectedWorld: World | null;
    cities: City[];
    selectedCity: City | null;
    onCitySelect: (city: City | null) => void;
    onCitiesChange: (cities: City[]) => void;
}

export default function CityManager({
                                    selectedWorld,
                                    cities,
                                    selectedCity,
                                    onCitySelect,
                                    onCitiesChange
                                    }: CityManagerProps) {
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

    /*
    Why refresh instead of just adding to state?
        Single source of truth: Database is authoritative
        Consistency: Ensures UI matches database exactly
        Simplicity: Same logic for all city list updates
     */
    async function refreshCities(worldId: string) {
        const cs = await listCities(worldId);
        onCitiesChange(cs); //tell App about new cities
        // Auto-select first city if none selected
        if (!selectedCity && cs.length > 0) {
            onCitySelect(cs[0]); //tell App to select city
        }
    }

    /*
    ========================================
                Event handlers
    ========================================
     */

    const handleAddCity = async () => {
        if (!selectedWorld) return;
        const name = prompt('City name:') || 'New City';
        const {city} = await addCity(selectedWorld.id, name);
        await refreshCities(selectedWorld.id);
        onCitySelect(city); // auto-select the new city
    };

    const handleCityChange = (cityId: string) => {
        const city = cities.find(c => c.id === cityId) || null;
        onCitySelect(city); // ← Tell App about selection change
    };


    return (
        <>
            {selectedWorld && (
                <section className="section">
                    <h3>Cities in {selectedWorld.name}</h3>

                    <div className="flex-row">
                        <button onClick={handleAddCity} className="btn btn-primary">
                            Add City
                        </button>
                    </div>

                    {cities.length > 0 ? (
                        <div className="flex-row">
                            <label htmlFor="city-select" className="label">Select city:</label>
                            <select
                                id="city-select"
                                value={selectedCity?.id || ''}
                                onChange={e => handleCityChange(e.target.value)}
                                className="input-wide"
                            >
                                <option value="">-- Select a city --</option>
                                {cities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p className="city-empty-state">
                            No cities yet. Add one to get started!
                        </p>
                    )}
                </section>
            )}
        </>
    );
}