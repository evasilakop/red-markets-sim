import type { MessageType} from "../common/types.ts";

export interface Message {
    id: string;
    type: MessageType;
    text: string;
    timestamp: number;
}

/**
 * Simple event-based message service.
 */
class MessageService {
    private listeners: Set<(messages: Message[]) => void> = new Set();
    private messages: Message[] = [];
    private timeouts: Map<string, number> = new Map();

    /**
     * Displays a message to users with automatic dismissal
     * @param type - Message type (success, error, warning)
     * @param text - Message content to display
     * @param duration - Auto-dismiss time in ms (0 = no auto-dismiss) default 5 seconds
     * @returns Message ID for manual dismissal
     */
    show(type: Message['type'], text: string, duration: number = 5000): string {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const message: Message = {
            id,
            type,
            text,
            timestamp: Date.now()
        };

        this.messages = [...this.messages, message];
        this.notifyListeners();

        // Auto-dismiss after duration
        if (duration > 0) {
            const timeout = setTimeout(() => {
                this.dismiss(id);
            }, duration);
            this.timeouts.set(id, timeout);              // timeout is number in browser
        }
        return id;
    }

    /**
     * Removes a specific message by its ID.
     * @param id Message ID to remove
     */
    dismiss(id: string): void {
        // Clear timeout if exists
        const timeout = this.timeouts.get(id);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(id);
        }
        this.messages = this.messages.filter(msg => msg.id !== id);
        this.notifyListeners();
    }

    /**
     * Clears all messages in all scopes.
     */
    clear(): void {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();

        this.messages = [];
        this.notifyListeners();
    }

    /**
     * Returns a shallow copy of all current messages.
     * @returns Array of current messages
     */
    getMessages(): Message[] {
        return [...this.messages];
    }

    /**
     * Subscribes to message changes.
     * @param listener Callback invoked with all messages whenever they change
     * @returns Unsubscribe function
     */
    subscribe(listener: (messages: Message[]) => void): () => void {
        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            listener(this.getMessages());
        });
    }
}

export const messageService = new MessageService();

/**
 * Function to show a success message in a given scope.
 * @param text Message text
 * @param duration Auto-dismiss time in ms (optional)
 * @returns Message ID
 */
export const showSuccess = (text: string, duration?: number) =>
    messageService.show('success', text, duration);

/**
 * Function to show an error message in a given scope.
 * @param text Message text
 * @param duration Auto-dismiss time in ms (optional)
 * @returns Message ID
 */
export const showError = (text: string, duration?: number) =>
    messageService.show('error', text, duration);

/**
 * Function to show a warning message in a given scope.
 * @param text Message text
 * @param duration Auto-dismiss time in ms (optional)
 * @returns Message ID
 */
export const showWarning = (text: string, duration?: number) =>
    messageService.show('warning', text, duration);