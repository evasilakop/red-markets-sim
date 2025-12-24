import { type Sector, type ActionType } from '../../common/types';
import { getEquilibriumDisplay, formatPriceIndex } from '../../utils/displayUtils';
import ActionSelector from './ActionSelector';
import './CityDashboard.css';

interface SectorRowProps {
    sector: Sector;
    onAction: (sectorId: string, action: ActionType, magnitude: number) => void;
    isBusy?: boolean;
}

export default function SectorRow({ sector, onAction, isBusy = false }: SectorRowProps) {
    const { label, color } = getEquilibriumDisplay(sector.equilibrium);

    const renderBar = (value: number, barColor: string) => (
        <div className="bar-container">
            <span className="bar-value">{value}</span>
            <div className="bar-track">
                <div
                    className="bar-fill"
                    style={{
                        width: `${Math.min(100, Math.max(0, value))}%`,
                        backgroundColor: barColor
                    }}
                />
            </div>
        </div>
    );

    /*
    =====================================================================
                                Render
    =====================================================================
    */
    return (
        <tr>
            <td className="col-type">{sector.type}</td>

            <td className="col-bar">
                {renderBar(sector.supply, '#2196f3')} {/* Blue for Supply */}
            </td>

            <td className="col-bar">
                {renderBar(sector.demand, '#ff9800')} {/* Orange for Demand */}
            </td>

            <td className="col-state">
                <span className="equilibrium-badge" style={{ color: color }}>
                    {label}
                </span>
            </td>

            <td className="col-stats">
                <div className="stat-row" title="Starting Chips">
                    <span>💰</span> {sector.startingChips}
                </div>
                <div className="stat-row" title="Competition Dice">
                    <span>🎲</span> {sector.competitionUndercutDice}
                </div>
            </td>

            <td className="col-price">
                {formatPriceIndex(sector.priceIndex)}
            </td>

            <td className="col-actions">
                <ActionSelector
                    onApply={(action, mag) => onAction(sector.id, action, mag)}
                    disabled={isBusy}
                />
            </td>
        </tr>
    );
}