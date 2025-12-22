import { describe, it, expect, beforeEach, vi } from 'vitest';
import { messageService } from '../app/services/messageService';
import type { MessageScope } from '../app/common/types';

describe('MessageService', () => {
    const scope: MessageScope = 'world';

    beforeEach(() => {
        // Clear all messages before each test
        messageService.clear();
    });

    it('should add and retrieve a message', () => {
        // Arrange (setup done in beforeEach)

        // Act
        const id = messageService.show('success', 'Test message', scope, 0);

        // Assert
        const messages = messageService.getMessages();
        expect(messages).toHaveLength(1);
        expect(messages[0].id).toBe(id);
        expect(messages[0].type).toBe('success');
        expect(messages[0].scope).toBe(scope);
        expect(messages[0].text).toBe('Test message');
    });

    it('should dismiss a message by id', () => {
        // Arrange
        const id = messageService.show('error', 'Error message', scope, 0);

        // Act
        messageService.dismiss(id);

        // Assert
        expect(messageService.getMessages()).toHaveLength(0);
    });

    it('should clear all messages', () => {
        // Arrange
        messageService.show('success', 'Message 1', scope, 0);
        messageService.show('error', 'Message 2', scope, 0);

        // Act
        messageService.clear();

        // Assert
        expect(messageService.getMessages()).toHaveLength(0);
    });

    it('should clear only messages for a given scope', () => {
        // Arrange
        messageService.show('success', 'World message', 'world', 0);
        messageService.show('error', 'City message', 'city', 0);
        messageService.show('warning', 'Another world message', 'world', 0);

        // Act
        messageService.clearScope('world');

        // Assert
        const remaining = messageService.getMessages();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].scope).toBe('city');
        expect(remaining[0].text).toBe('City message');
    });

    it('should auto-dismiss messages after duration', () => {
        // Arrange
        vi.useFakeTimers();

        // Act
        messageService.show('warning', 'Auto dismiss message', scope, 1000);
        expect(messageService.getMessages()).toHaveLength(1);

        vi.advanceTimersByTime(1000);

        // Assert
        expect(messageService.getMessages()).toHaveLength(0);

        vi.useRealTimers();
    });

    it('should notify listeners when messages change', () => {
        // Arrange
        const listener = vi.fn();
        const unsubscribe = messageService.subscribe(listener);

        // Act
        const id = messageService.show('success', 'Hello', scope, 0);

        // Assert
        expect(listener).toHaveBeenCalled();
        expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                id,
                type: 'success',
                text: 'Hello',
                scope
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
        messageService.show('success', 'Test', scope, 0);

        // Assert
        expect(listener).not.toHaveBeenCalled();
    });
});