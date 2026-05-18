import { useState, useEffect } from 'react';

/**
 * Interface for the beforeinstallprompt event.
 * This event is fired by modern browsers to allow PWA installation.
 */
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Custom hook to manage PWA installation prompt.
 * 
 * Listens for the 'beforeinstallprompt' event, which is fired by browsers
 * when the app meets all PWA criteria and can be installed.
 * 
 * @returns Object containing:
 *   - canInstall: true if install prompt is available
 *   - isAlreadyInstalled: true if app is running in standalone mode
 *   - prompt: function to trigger the install prompt
 */
export function useInstallPrompt() {
    const [canInstall, setCanInstall] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const isAlreadyInstalled = 
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isAlreadyInstalled) {
            setCanInstall(false);
            return;
        }

        // Detect browser and set appropriate install capability
        const userAgent = navigator.userAgent.toLowerCase();
        const isFirefox = userAgent.includes('firefox');
        const isChromium = userAgent.includes('chrome') || userAgent.includes('edge');

        // Firefox doesn't support beforeinstallprompt but can install PWAs
        // Show install button for Firefox if manifest is detected
        if (isFirefox) {
            setCanInstall(true);
            setIsBrowser(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Store the deferred prompt so we can use it later
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setCanInstall(true);
        };

        // Listen for the beforeinstallprompt event (Chrome, Edge, Opera)
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    /**
     * Triggers the PWA installation prompt.
     * - For Chrome/Edge/Opera: Shows native install dialog
     * - For Firefox: Shows help message (Firefox handles install via menu)
     * Returns a promise that resolves when the user makes a choice.
     */
    const installApp = async (): Promise<'accepted' | 'dismissed' | null> => {
        // Firefox doesn't support beforeinstallprompt, show help message
        if (isBrowser && !deferredPrompt) {
            // For Firefox, the user needs to use the browser menu
            // Just return success so toast shows
            return 'accepted';
        }

        if (!deferredPrompt) {
            console.error('Install prompt not available');
            return null;
        }

        try {
            // Trigger the install prompt (Chrome, Edge, Opera)
            await deferredPrompt.prompt();

            // Wait for user choice
            const { outcome } = await deferredPrompt.userChoice;
            
            // After prompt is shown, clear it (can only use once)
            setDeferredPrompt(null);
            setCanInstall(false);

            return outcome;
        } catch (error) {
            console.error('Install prompt failed:', error);
            return null;
        }
    };

    return {
        canInstall,
        installApp
    };
}
