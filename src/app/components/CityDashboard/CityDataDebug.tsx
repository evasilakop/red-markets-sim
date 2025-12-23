import { useCityData } from '../../hooks/useCityData';
import { getEquilibriumDisplay } from '../../utils/displayUtils';

interface CityDataDebugProps {
    cityId: string | null;
}

export default function CityDataDebug({ cityId }: CityDataDebugProps) {
    // This hook will trigger a re-render whenever the DB changes!
    const data = useCityData(cityId);

    if (!cityId) {
        return <div className="p-4 text-gray-500">No city selected.</div>;
    }

    if (data === undefined) {
        return <div className="p-4">Loading data...</div>;
    }

    if (data === null) {
        return <div className="p-4 text-red-500">City not found in database.</div>;
    }

    const { city, sectors } = data;

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h3>Debug: Live Data Stream</h3>

            {/* City Details */}
            <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
                <strong>City:</strong> {city.name} (ID: {city.id})<br/>
                <strong>Last Tick:</strong> {new Date(city.lastTick).toLocaleTimeString()}
            </div>

            {/* Sector Table Dump */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
                    <th>Type</th>
                    <th>Supply</th>
                    <th>Demand</th>
                    <th>State</th>
                    <th>Chips</th>
                    <th>Dice</th>
                </tr>
                </thead>
                <tbody>
                {sectors.map(sector => {
                    const display = getEquilibriumDisplay(sector.equilibrium);
                    return (
                        <tr key={sector.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td>{sector.type}</td>
                            <td>{sector.supply}</td>
                            <td>{sector.demand}</td>
                            <td style={{ color: display.color, fontWeight: 'bold' }}>
                                {sector.equilibrium}
                            </td>
                            <td>{sector.startingChips}</td>
                            <td>{sector.competitionUndercutDice}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>

            {/* Raw JSON for deep inspection */}
            <details style={{ marginTop: '20px' }}>
                <summary style={{ cursor: 'pointer', color: 'blue' }}>View Raw JSON</summary>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </details>
        </div>
    );
}