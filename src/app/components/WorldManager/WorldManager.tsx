import React, {useEffect, useState, useCallback} from 'react';
import {type World} from '../../common/types';
import {useMessages} from "../../hooks/useMessages.ts";
import {
    createWorld,
    deleteWorld,
    exportWorld,
    importWorld,
    listWorlds
} from '../../services/worldService';
import {
    checkBrowserSupport,
    formatFileSize,
    MAX_FILE_SIZE,
    SUPPORTED_FILE_TYPES
} from "../../services/validation.ts";
import MessageDisplay from "../MessageDisplay/MessageDisplay.tsx";
import ConfirmationDialog from "../../common/ConfirmationDialog.tsx";

/**
 * Props for the WorldManager component.
 */
interface WorldManagerProps {
    /** The currently selected world, or null if none selected */
    selectedWorld: World | null;
    /** Callback invoked when user selects a different world */
    onWorldSelect: (world: World | null) => void;
}

/**
 * React component for managing world operations including creation, selection,
 * import, export, and deletion. Displays user feedback messages and handles
 * file validation for world import/export operations.
 * @param props Component props
 * @returns The rendered WorldManager component
 */
export default function WorldManager({selectedWorld, onWorldSelect}: WorldManagerProps) {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [newWorldName, setNewWorldName] = useState('My World');
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const {showSuccess, showError, showWarning} = useMessages('world');

    const refreshWorlds = useCallback(async (isActive: boolean = true) => {
        try {
            const ws = await listWorlds();
            // Check active flag to prevent setting state on unmounted component
            if (isActive) {
                setWorlds(ws);
                // Auto-select first world if none selected
                if (!selectedWorld && ws.length > 0) {
                    onWorldSelect(ws[0]);
                }
            }
        } catch (error) {
            console.error("Failed to list worlds", error);
        }
    }, [onWorldSelect, selectedWorld]);

    useEffect(() => {
        let active = true;
        refreshWorlds(active);
        return () => {
            active = false;
        };
    }, [refreshWorlds]);

    // Browser compatibility check on mount
    useEffect(() => {
        const browserCheck = checkBrowserSupport();
        if (!browserCheck.supported) {
            showError(`Your browser doesn't support required features: ${browserCheck.missingFeatures.join(', ')}. Please use a modern browser.`);
        }
    }, [showError]);

    /*
    =====================================================================
                              Event handlers
    =====================================================================
     */

    /**
     * Creates a new world with the specified name and refreshes the world list.
     */
    const handleCreateWorld = async () => {
        try {
            const world = await createWorld(newWorldName || 'World');
            await refreshWorlds();
            onWorldSelect(world);
            setNewWorldName('My World');
        } catch (error) {
            showError("Failed to create world");
        }
    };

    /**
     * Handles world selection change from the dropdown.
     * @param worldId The ID of the selected world
     */
    const handleWorldChange = (worldId: string) => {
        const world = worlds.find(w => w.id === worldId) || null;
        onWorldSelect(world);
    };

    /**
     * Exports the currently selected world to a downloadable JSON file.
     * Handles loading states and displays appropriate success/error messages.
     */
    const handleExportWorld = async () => {
        if (!selectedWorld || isExporting) return;

        setIsExporting(true);
        try {
            const result = await exportWorld(selectedWorld.id);
            if (result.success) {
                showSuccess('World exported successfully');
            } else {
                // service worked but the operation failed
                showError(result.error || 'Download failed');
            }
        } catch (error) {
            // service itself failed
            console.error('Export failed:', error);
            showError('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Deletes the currently selected world after user confirmation.
     * Removes all associated cities and sectors. Shows confirmation dialog
     * and handles loading states with user feedback.
     */
    const handleDeleteWorld = async () => {
        if (!selectedWorld) return;
        setShowConfirm(true);
    };

    const confirmDeleteWorld = async () => {
        if (!selectedWorld) return;
        setShowConfirm(false);
        setIsDeleting(true);

        try {
            const result = await deleteWorld(selectedWorld.id);
            if (result.success) {
                showSuccess(result.message || 'World deleted!');
                onWorldSelect(null);
                await refreshWorlds();
            } else {
                console.error(result.error);
                showError(result.error?.toString() as string);
            }
        } catch (error) {
            console.error('Delete world failed:', error);
            showError('Delete world failed. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDeleteWorld = () => {
        setShowConfirm(false);
    };

    const handleImportWorld = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isImporting) return;

        // Check browser support first
        const browserCheck = checkBrowserSupport();
        if (!browserCheck.supported) {
            showError(`Browser not supported. Missing: ${browserCheck.missingFeatures.join(', ')}`);
            e.target.value = '';
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showError(`File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
            e.target.value = '';
            return;
        }

        // Check file type (basic check - we'll do more validation after reading)
        if (!SUPPORTED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.json')
            && !file.name.endsWith('.rmworld.json')) {
            showWarning('Unexpected file type. Expected .json or .rmworld.json file.');
        }

        setIsImporting(true);

        try {
            const result = await importWorld(file);
            if (result.success) {
                showSuccess(`World "${result.worldName}" imported successfully`);
                await refreshWorlds();
                const importedWorld = worlds.find(w => w.name === result.worldName);
                if (importedWorld) {
                    onWorldSelect(importedWorld);
                }
            } else {
                showError(result.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import failed:', error);
            showError('Import failed. Please try again.');
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    /*
    =====================================================================
                                    Render
    =====================================================================
    */
    return (
        <>
            <section className="section">
                <h3>World Management</h3>
                <MessageDisplay scope="world"/>

                <div className="flex-row">
                    <label htmlFor="world-select" className="label-wide">World:</label>
                    <select
                        id="world-select"
                        value={selectedWorld?.id || ''}
                        onChange={e => handleWorldChange(e.target.value)}
                        className="input-wide"
                    >
                        <option value="">
                            {worlds.length === 0 ? 'No worlds yet' : 'Select a world...'}
                        </option>
                        {worlds.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>

                {/* Actions Row */}
                <div className="flex-row world-actions-toolbar">
                    <label className="label-wide">Actions:</label>

                    {/* Group 1: Create */}
                    <div className="action-group">
                        <input
                            type="text"
                            value={newWorldName}
                            onChange={e => setNewWorldName(e.target.value)}
                            placeholder="World name"
                            className="input-wide"
                            disabled={isImporting || isExporting || isDeleting}
                        />
                        <button
                            onClick={handleCreateWorld}
                            disabled={isImporting || isExporting || isDeleting}
                            className="btn btn-primary"
                        >
                            Create
                        </button>
                    </div>

                    {/* Group 2: Manage (Export/Delete) */}
                    <div className="action-group">
                        {selectedWorld ? (
                            <>
                                <button
                                    onClick={handleExportWorld}
                                    disabled={isExporting || isImporting || isDeleting}
                                    className={`btn btn-success ${isExporting ? 'btn-loading' : ''}`}
                                >
                                    {isExporting ? 'Exporting' : 'Export'}
                                </button>
                                <button
                                    onClick={handleDeleteWorld}
                                    disabled={isDeleting || isImporting || isExporting}
                                    className={`btn btn-danger ${isDeleting ? 'btn-loading' : ''}`}
                                >
                                    {isDeleting ? 'Deleting' : 'Delete'}
                                </button>
                            </>
                        ) : (
                            <span style={{color: '#999', fontStyle: 'italic', padding: '0 8px'}}>
                                Select a world first
                            </span>
                        )}
                    </div>

                    {/* Group 3: Import */}
                    <div className="action-group">
                        <input
                            type="file"
                            accept=".json,.rmworld.json"
                            onChange={handleImportWorld}
                            disabled={isImporting || isExporting || isDeleting}
                            className="input-wide file-input"
                        />
                        {isImporting && <span className="loading-text">Importing...</span>}
                    </div>
                </div>

            </section>
            {showConfirm && selectedWorld && (
                <ConfirmationDialog
                    message={`Delete world "${selectedWorld.name}"? This will remove all cities and sectors. This cannot be undone.`}
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    onConfirm={confirmDeleteWorld}
                    onCancel={cancelDeleteWorld}
                />
            )}
        </>
    );
}