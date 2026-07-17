import {useCallback, useEffect, useState} from 'react';
import {type World} from '../../common/types';
import {useMessages} from '../../hooks/useMessages.ts'
import {useSimWorker} from '../../hooks/useSimWorker.ts'
import {
    createWorld,
    deleteWorld,
    exportWorld,
    importWorld,
    listWorlds,
    tickWorld
} from '../../services/worldService';
import {
    Box,
    Button,
    FileButton,
    Group,
    Menu,
    Select,
    TextInput,
    Title
} from '@mantine/core';
import {modals} from '@mantine/modals';

interface WorldManagerProps {
    selectedWorld: World | null;
    onWorldSelect: (world: World | null) => void;
}

export default function WorldTopBar({selectedWorld, onWorldSelect}: Readonly<WorldManagerProps>) {
    const [worlds, setWorlds] = useState<World[]>([]);
    const {showSuccess, showError} = useMessages();
    const {busy, tick} = useSimWorker();

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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
        refreshWorlds(active);
        return () => { active = false; };
    }, [refreshWorlds]);

    /* ================= Actions ================= */

    // CREATE
    const openCreateModal = () => {
        let nameInput = '';
        modals.openConfirmModal({
            title: 'Create new world',
            centered: true,
            children: (
                <TextInput
                    label={'World Name'}
                    placeholder={'My New Campaign'}
                    data-autofocus
                    onChange={(e) => nameInput = e.target.value}
                />
            ),
            labels: { confirm: 'Create', cancel: 'Cancel' },
            onConfirm: async () => {
                try {
                    const world = await createWorld(nameInput || 'New World');
                    await refreshWorlds();
                    onWorldSelect(world);
                } catch (e) {
                    console.error(e);
                    showError("Failed to create world");
                }
            }
        });
    };

    // IMPORT via File Button
    const handleImport = async (file: File | null) => {
        if (!file) return;
        try {
            const result = await importWorld(file);
            if (result.success) {
                showSuccess(`Imported ${result.worldName}`);
                await refreshWorlds();
                // Find and select the new world
                const newWorld = (await listWorlds()).find(w => w.name === result.worldName);
                if (newWorld) onWorldSelect(newWorld);
            } else {
                showError(result.error || 'Import failed');
            }
        } catch (e) {
            console.error(e);
            showError("Import failed");
        }
    };

    // EXPORT
    const handleExport = async () => {
        if (!selectedWorld) return;
        await exportWorld(selectedWorld.id);
        showSuccess("World exported");
    };

    // ADVANCE WORLD (tick all sectors, increment turn)
    const handleAdvanceWorld = async () => {
        if (!selectedWorld) return;
        const result = await tickWorld(selectedWorld.id, tick);
        if (result.success) {
            // Derive the updated world from tickWorld's return value
            onWorldSelect({ ...selectedWorld, turn: result.result.turn });
            await refreshWorlds();
            showSuccess(
                `World advanced to Turn ${result.result.turn}. ${result.result.changedSectors} sectors changed state.`
            );
        } else {
            showError(result.error);
        }
    };

    // DELETE
    const openDeleteModal = () => {
        if (!selectedWorld) return;
        modals.openConfirmModal({
            title: 'Delete World',
            centered: true,
            children: `Are you sure you want to delete ${selectedWorld.name}?`,
            labels: { confirm: 'Delete', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                await deleteWorld(selectedWorld.id);
                onWorldSelect(null);
                await refreshWorlds();
                showSuccess("World deleted");
            }
        });
    };

    /*
    =====================================================================
                                Render
    =====================================================================
    */
    return (
        <Group h={'100%'} px={'md'} justify={'space-between'} bg={'var(--mantine-color-body)'}>

            {/* LEFT: Logo & Switcher (Always Visible) */}
            <Group>
                <Title order={1}>RMS</Title>
                {/* Shortened Logo for mobile */}
                <Select
                    placeholder={'World...'}
                    data={worlds.map(w => ({value: w.id, label: w.name}))}
                    value={selectedWorld?.id || null}
                    onChange={(id) => {
                        const w = worlds.find(w => w.id === id);
                        // If 'w' is undefined (shouldn't happen) pass null
                        onWorldSelect(w || null);
                    }}
                    w={{base: 120, sm: 250}}
                    nothingFoundMessage={'No world found'}
                    allowDeselect={false}
                />
                <Button variant={'light'}
                        onClick={openCreateModal}
                        p={0}
                        w={30}
                        aria-label="Create New World"
                >
                    +
                </Button>
            </Group>

            {/* RIGHT: Desktop Actions (Visible on SM+) */}
            <Group visibleFrom={'sm'}>
                <FileButton onChange={handleImport} accept={'.json'}>
                    {(props) => <Button {...props}>Import</Button>}
                </FileButton>

                {selectedWorld && (
                    <>
                        <Button onClick={handleExport}>Export</Button>
                        <Button
                            disabled={busy}
                            onClick={handleAdvanceWorld}>
                            Advance World (Turn {selectedWorld.turn})
                        </Button>
                        <Button color={'red'}
                                variant={'light'}
                                onClick={openDeleteModal}>
                            Delete
                        </Button>
                    </>
                )}
            </Group>

            {/* RIGHT: Mobile Menu (Hidden on SM+) */}
            <Box hiddenFrom={'sm'}>
            <Menu shadow={'md'} width={200}>
                <Menu.Target>
                    <Button variant={'subtle'}
                            aria-label="Open Menu"
                    >
                        ☰
                    </Button>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Label>World Actions</Menu.Label>

                    <FileButton onChange={handleImport} accept={'.json'}>
                        {(props) => <Menu.Item {...props}>Import World</Menu.Item>}
                    </FileButton>

                    {selectedWorld && (
                        <>
                            <Menu.Item onClick={handleExport}>Export World</Menu.Item>
                            <Menu.Item disabled={busy} onClick={handleAdvanceWorld}>
                                Advance World (Turn {selectedWorld.turn})
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item color={'red'} onClick={openDeleteModal}>Delete World</Menu.Item>
                        </>
                    )}
                </Menu.Dropdown>
            </Menu>
            </Box>
        </Group>
    );
}