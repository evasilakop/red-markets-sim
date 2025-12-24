import React, { useState } from 'react';
import { type ActionType } from '../../common/types';
import { ACTION_OPTIONS } from "../../common/constants.ts";

interface ActionSelectorProps {
    onApply: (action: ActionType, magnitude: number) => void;
    disabled?: boolean;
}

export default function ActionSelector({ onApply, disabled = false }: ActionSelectorProps) {
    const [selectedAction, setSelectedAction] = useState<ActionType>('MARKET');
    const [magnitude, setMagnitude] = useState(1);

    /*
    =====================================================================
                              Event handlers
    =====================================================================
     */

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApply(selectedAction, magnitude);
    };

    /*
    =====================================================================
                                Render
    =====================================================================
    */
    return (
        <form onSubmit={handleSubmit} className="action-form">
            <select
                className="action-select"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                disabled={disabled}
            >
                {ACTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <input
                className="action-input"
                type="number"
                min={0}
                max={10}
                value={magnitude}
                onChange={(e) => setMagnitude(Number(e.target.value))}
                disabled={disabled}
            />

            <button
                type="submit"
                className="btn btn-primary action-btn"
                disabled={disabled}
            >
                Apply
            </button>
        </form>
    );
}