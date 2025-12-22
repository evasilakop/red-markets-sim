import {useEffect, useState} from 'react';
import {type Message, messageService} from '../services/messageService';
import type {MessageScope} from "../common/types.ts";

export const useMessages = (scope: MessageScope) => {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const unsubscribe = messageService.subscribe((allMessages) => {
            const scopedMessages = allMessages.filter(msg => msg.scope === scope);
            setMessages(scopedMessages);
        });

        // Get initial messages for this scope
        const initialMessages = messageService.getMessages().filter(msg => msg.scope === scope);
        setMessages(initialMessages);

        return unsubscribe;
    }, [scope]);

    return {
        messages,
        showSuccess: (text: string, duration?: number) => messageService.show('success', text, scope, duration),
        showError: (text: string, duration?: number) => messageService.show('error', text, scope, duration),
        showWarning: (text: string, duration?: number) => messageService.show('warning', text, scope, duration),
        dismiss: (id: string) => messageService.dismiss(id),
        clear: () => messageService.clear(),
        clearScope: () => messageService.clearScope(scope)
    };
};