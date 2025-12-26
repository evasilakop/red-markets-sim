import { notifications } from '@mantine/notifications';

export function useMessages() {

    const showSuccess = (message: string) => {
        notifications.show({
            title: 'Success',
            position: 'top-right',
            message: message,
            color: 'green',
            autoClose: 4000,
            withCloseButton: true,
        });
    };

    const showError = (message: string) => {
        notifications.show({
            title: 'Error',
            position: 'top-right',
            message: message,
            color: 'red',
            autoClose: false, // Errors stay until dismissed
            withCloseButton: true,
        });
    };

    const showWarning = (message: string) => {
        notifications.show({
            title: 'Warning',
            position: 'top-right',
            message: message,
            color: 'orange',
            autoClose: 6000,

        });
    };

    // 'messages' and 'dismiss' are no longer needed by components,
    // but if you have code relying on them, you might need to return dummy values
    // or refactor the consumers.
    // For now, let's return the methods we actually use.
    return {
        showSuccess,
        showError,
        showWarning
    };
}