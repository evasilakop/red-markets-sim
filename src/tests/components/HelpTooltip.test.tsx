import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpTooltip from '../../app/components/common/HelpTooltip';
import { MantineProvider } from '@mantine/core';

/**
 * Wraps components with MantineProvider for tooltip rendering.
 */
function renderHelpTooltip(ui: React.ReactNode) {
    return render(
        <MantineProvider>
            {ui}
        </MantineProvider>
    );
}

describe('HelpTooltip', () => {
    it('renders the help icon button', () => {
        renderHelpTooltip(<HelpTooltip label={'Test tooltip text'} />);

        // The ActionIcon should be present
        const iconButton = screen.getByRole('button', { name: /help/i });
        expect(iconButton).toBeInTheDocument();
    });

    it('displays tooltip content on hover', async () => {
        const tooltipText = 'This is a test tooltip.';
        const user = userEvent.setup();

        renderHelpTooltip(<HelpTooltip label={tooltipText} />);

        const iconButton = screen.getByRole('button', { name: /help/i });
        await user.hover(iconButton);

        // Wait for the tooltip to appear
        await waitFor(() => {
            expect(screen.getByText(tooltipText)).toBeInTheDocument();
        });
    });

    it('renders with custom icon size', () => {
        renderHelpTooltip(<HelpTooltip label={'Custom size tooltip'} size={24} />);

        const iconButton = screen.getByRole('button', { name: /help/i });
        expect(iconButton).toBeInTheDocument();
    });
});
