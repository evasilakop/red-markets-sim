import "./ConfirmationDialog.css";

type ConfirmationDialogProps = {
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmationDialog({
                                               message,
                                               confirmLabel = "Confirm",
                                               cancelLabel = "Cancel",
                                               onConfirm,
                                               onCancel
                                           }: ConfirmationDialogProps) {
    return (
        <div className="modal-overlay">
            <div className="modal-dialog">
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                    <button className="btn" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}