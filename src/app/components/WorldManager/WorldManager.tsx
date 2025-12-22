import React, {useEffect, useState} from 'react';
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
    const [isDeleting, setIsDeleting] = useState(false);
    const {showSuccess, showError, showWarning} = useMessages('world');

    // Load worlds on mount
    useEffect(() => {
        refreshWorlds();
    }, []);

    // Browser compatibility check on mount
    useEffect(() => {
        const browserCheck = checkBrowserSupport();
        if (!browserCheck.supported) {
            showError(`Your browser doesn't support required features: ${browserCheck.missingFeatures.join(', ',)}. Please use a modern browser.`);
        }
    }, []);

    /*
    =====================================================================
                              Helper functions
    =====================================================================
     */

    /**
     * Refreshes the list of worlds from the database and auto-selects the first
     * world if none is currently selected.
     */
    const refreshWorlds = async () => {
        const ws = await listWorlds();
        setWorlds(ws);
        // Auto-select first world if none selected
        if (!selectedWorld && ws.length > 0) {
            onWorldSelect(ws[0]);
        }
    };

    /*
    =====================================================================
                              Event handlers
    =====================================================================
     */

    /**
     * Creates a new world with the specified name and refreshes the world list.
     */
    const handleCreateWorld = async () => {
        const world = await createWorld(newWorldName || 'World');
        await refreshWorlds();
        onWorldSelect(world);
        setNewWorldName('My World');
    };

    /**
     * Handles world selection change from the dropdown.
     * @param worldId The ID of the selected world
     */
    const handleWorldChange = (worldId: string) => {
        const world = worlds.find(w => w.id === worldId) || null;
        onWorldSelect(world);
        showSuccess('World updated!');
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
        if (!selectedWorld || isDeleting) return;

        // Still need the confirmation dialog for now
        const confirmed = confirm(`Delete world "${selectedWorld.name}"? This will remove all cities and sectors. This cannot be undone.`);
        if (!confirmed) return;

        setIsDeleting(true);
        // Clear any existing messages before starting

        try {
            const result = await deleteWorld(selectedWorld.id);

            if (result.success) {
                // Show success message
                showSuccess(result.message || 'World deleted successfully');
                onWorldSelect(null); // Tell parent to clear selection
                await refreshWorlds();
            } else {
                showError(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            showError('Delete failed. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    /**
     * Handles world import from a selected file with comprehensive validation.
     * Validates browser support, file size, file type, and file structure.
     * Displays appropriate feedback messages for all validation and import states.
     * @param e File input change event containing the selected file
     */
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
            showWarning('Unexpected file type. Expected .json or .rmworld.json' + ' file.');
            // Don't return here - let them try anyway, our validation will catch issues
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
        <section className="section">
            <h3>World Management</h3>
            <MessageDisplay scope="world"/>
            {/* World Selection Row */}
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
            <div className="flex-row">
                <label className="label-wide">Actions:</label>

                {/* Create World */}
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
                    Create World
                </button>

                <span className="divider">|</span>

                {/* World Operations */}
                {selectedWorld ? (
                    <>
                        <button
                            onClick={handleExportWorld}
                            disabled={isExporting || isImporting || isDeleting}
                            className={`btn btn-success ${isExporting ? 'btn-loading' : ''}`}
                        >
                            {isExporting ? 'Exporting' : 'Export World'}
                        </button>
                        <button
                            onClick={handleDeleteWorld}
                            disabled={isDeleting || isImporting || isExporting}
                            className={`btn btn-danger ${isDeleting ? 'btn-loading' : ''}`}
                        >
                            {isDeleting ? 'Deleting' : 'Delete World'}
                        </button>
                    </>
                ) : (
                    <span style={{color: '#999', fontStyle: 'italic'}}>Select a world first</span>
                )}

                <span className="divider">|</span>

                {/* Import */}
                <input
                    type="file"
                    accept=".json,.rmworld.json"
                    onChange={handleImportWorld}
                    disabled={isImporting || isExporting || isDeleting}
                    className="input-wide"
                />
                {isImporting && <span className="loading-text">Importing...</span>}
            </div>
        </section>
    );
}