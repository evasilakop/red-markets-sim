import { AnimatePresence, motion } from 'framer-motion';
import type { MessageScope } from "../../common/types.ts";
import { useMessages } from "../../hooks/useMessages.ts";
import './MessageDisplay.css';

export default function MessageDisplay({ scope }: { scope: MessageScope }) {
    const { messages, dismiss } = useMessages(scope);

    return (
        <div className="message-stack">
            <AnimatePresence>
                {messages.map(msg => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`message message-${msg.type}`}
                    >
                        {msg.text}
                        <button className="dismiss" onClick={() => dismiss(msg.id)}>×</button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}