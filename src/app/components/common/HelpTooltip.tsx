import {ActionIcon, Tooltip} from '@mantine/core';
import {IconHelpCircle} from '@tabler/icons-react';

interface HelpTooltipProps {
    /** The tooltip text to display on hover. */
    label: string;
    /** Optional icon size in pixels. Defaults to 16. */
    size?: number;
}

/**
 * A small question-mark icon button that reveals a tooltip on hover.
 * Used throughout the app to provide brief explanations of game terms.
 */
export default function HelpTooltip({label, size = 16}: Readonly<HelpTooltipProps>) {
    return (
        <Tooltip label={label} multiline={true} w={260} withArrow={true}>
            <ActionIcon
                variant={'subtle'}
                color={'gray'}
                size={'xs'}
                aria-label={'Help'}
                style={{cursor: 'help'}}
            >
                <IconHelpCircle size={size} />
            </ActionIcon>
        </Tooltip>
    );
}
