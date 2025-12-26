import { describe, it, expect, beforeEach, vi } from 'vitest';
import { messageService } from '../app/services/messageService';

describe('MessageService', () => {

    beforeEach(() => {
        // Clear all messages before each test
        messageService.clear();
    });

    it('should add and retrieve a message', () => {
        // Arrange (setup done in beforeEach)

        // Act
        const id = messageService.show('success', 'Test message', 0);

        // Assert
        const messages = messageService.getMessages();
        expect(messages).toHaveLength(1);
        expect(messages[0].id).toBe(id);
        expect(messages[0].type).toBe('success');
        expect(messages[0].text).toBe('Test message');
    });

    it('should notify listeners when messages change', () => {
        // Arrange
        const listener = vi.fn();
        const unsubscribe = messageService.subscribe(listener);

        // Act
        const id = messageService.show('success', 'Hello', 0);

        // Assert
        expect(listener).toHaveBeenCalled();
        expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                id,
                type: 'success',
                text: 'Hello',
            })
        ]));

        // Cleanup
        unsubscribe();
    });

    it('should return unsubscribe function that removes listener', () => {
        // Arrange
        const listener = vi.fn();
        const unsubscribe = messageService.subscribe(listener);

        // Act
        unsubscribe();
        messageService.show('success', 'Test', 0);

        // Assert
        expect(listener).not.toHaveBeenCalled();
    });
});