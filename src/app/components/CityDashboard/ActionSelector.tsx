import React, {useState} from 'react';
import {type ActionType} from '../../common/types';
import {ACTION_OPTIONS} from '../../common/constants';
import {Button, Group, NumberInput, Select} from '@mantine/core';

interface ActionSelectorProps {
    onApply: (action: ActionType, magnitude: number) => void;
    disabled?: boolean;
}

export default function ActionSelector({ onApply, disabled = false }: ActionSelectorProps) {
    // Note: Select value can be null, so we default to the first option
    const [selectedAction, setSelectedAction] = useState<string>('MARKET');
    const [magnitude, setMagnitude] = useState<number | string>(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Cast back to ActionType safely
        if (selectedAction) {
            onApply(selectedAction as ActionType, Number(magnitude));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Group gap={'xs'} wrap={'nowrap'}>
                {/* 1. The Dropdown */}
                <Select
                    data={ACTION_OPTIONS}
                    value={selectedAction}
                    onChange={(val) => val && setSelectedAction(val)}
                    disabled={disabled}
                    allowDeselect={false} // Prevent clearing the selection
                    w={160} // Fixed width so it doesn't jump around
                    size={'sm'}
                    aria-label={'Select Action'}
                />

                {/* 2. The Magnitude Input */}
                <NumberInput
                    min={0}
                    max={10}
                    value={magnitude}
                    onChange={setMagnitude}
                    disabled={disabled}
                    w={60} // Small fixed width for the number
                    size={'sm'}
                    aria-label={'Magnitude'}
                />

                {/* 3. The Apply Button */}
                <Button
                    type={'submit'}
                    size={'sm'}
                    disabled={disabled}
                    variant={'filled'}
                    color={'gray'}
                >
                    Apply
                </Button>
            </Group>
        </form>
    );
}