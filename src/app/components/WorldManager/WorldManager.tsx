import React, {useEffect, useState} from 'react';
import {type World} from '../../common/types';
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

interface WorldManagerProps {
    selectedWorld: World | null;
    onWorldSelect: (world: World | null) => void;
}

export default function WorldManager({ selectedWorld, onWorldSelect }: WorldManagerProps) {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [newWorldName, setNewWorldName] = useState('My World');
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error' | 'warning';
        text: string;
    } | null>(null);

    // Load worlds on mount
    useEffect(() => {
        refreshWorlds();
    }, []);

    // Browser compatibility check on mount
    useEffect(() => {
        const browserCheck = checkBrowserSupport();
        if (!browserCheck.supported) {
            showMessage('error',
                `Your browser doesn't support required features: ${browserCheck.missingFeatures.join(', ')}. Please use a modern browser.`
            );
        }
    }, []);

    /*
    =====================================================================
                              Helper functions
    =====================================================================
     */
    const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

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
    const handleCreateWorld = async () => {
        const world = await createWorld(newWorldName || 'World');
        await refreshWorlds();
        onWorldSelect(world);
        setNewWorldName('My World');
    };

    const handleWorldChange = (worldId: string) => {
        const world = worlds.find(w => w.id === worldId) || null;
        onWorldSelect(world);
    };

    const handleExportWorld = async () => {
        if (!selectedWorld || isExporting) return;

        setIsExporting(true);
        setMessage(null);

        try {
            const result = await exportWorld(selectedWorld.id);
            if (result.success) {
                showMessage('success', result.message || 'World exported successfully');
            } else {
                showMessage('error', result.error || 'Export failed');
            }
        } catch (error) {
            console.error('Export failed:', error);
            showMessage('error', 'Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteWorld = async () => {
        if (!selectedWorld || isDeleting) return;

        const confirmed = confirm(`Delete world "${selectedWorld.name}"? This will remove all cities and sectors. This cannot be undone.`);
        if (!confirmed) return;

        setIsDeleting(true);
        setMessage(null);

        try {
            const result = await deleteWorld(selectedWorld.id);
            if (result.success) {
                showMessage('success', result.message || 'World deleted successfully');
                onWorldSelect(null); // Tell parent to clear selection
                await refreshWorlds();
            } else {
                showMessage('error', result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            showMessage('error', 'Delete failed. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleImportWorld = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isImporting) return;

        // Check browser support first
        const browserCheck = checkBrowserSupport();
        if (!browserCheck.supported) {
            showMessage('error', `Browser not supported. Missing: ${browserCheck.missingFeatures.join(', ')}`);
            e.target.value = '';
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showMessage('error',
                `File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
            );
            e.target.value = '';
            return;
        }

        // Check file type (basic check - we'll do more validation after reading)
        if (!SUPPORTED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.json') && !file.name.endsWith('.rmworld.json')) {
            showMessage('warning', 'Unexpected file type. Expected .json or .rmworld.json file.');
            // Don't return here - let them try anyway, our validation will catch issues
        }

        setIsImporting(true);
        setMessage(null);

        try {
            const result = await importWorld(file);
            if (result.success) {
                showMessage('success', `World "${result.worldName}" imported successfully`);
                await refreshWorlds();
                const importedWorld = worlds.find(w => w.name === result.worldName);
                if (importedWorld) {
                    onWorldSelect(importedWorld);
                }
            } else {
                showMessage('error', result.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import failed:', error);
            showMessage('error', 'Import failed. Please try again.');
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    return (
        <section className="section">
            <h3>World Management</h3>

            {/* Message Display */}
            {message && (
                <div className="world-messages">
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                </div>
            )}

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
                    <span style={{ color: '#999', fontStyle: 'italic' }}>Select a world first</span>
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