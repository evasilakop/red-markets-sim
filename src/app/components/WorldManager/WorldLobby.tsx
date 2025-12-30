import {useCallback, useEffect, useState} from 'react';
import {
    Badge,
    Button,
    Card,
    Container,
    Group,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title
} from '@mantine/core';
import {modals} from '@mantine/modals';
import {type World} from '../../common/types';
import {createWorld, deleteWorld, listWorlds} from '../../services/worldService';
import {useMessages} from '../../hooks/useMessages';

interface WorldLobbyProps {
    onWorldSelect: (world: World) => void;
}

export default function WorldLobby({ onWorldSelect }: WorldLobbyProps) {
    const [worlds, setWorlds] = useState<World[]>([]);
    const {showError, showSuccess} = useMessages();

    // 1. Data Fetching (Independent)
    const refreshWorlds = useCallback(async () => {
        const ws = await listWorlds();
        setWorlds(ws);
    }, []);

    useEffect(() => {
        refreshWorlds();
    }, [refreshWorlds]);

    // 2. Create Logic
    const openCreateModal = () => {
        let nameInput = '';
        modals.openConfirmModal({
            title: 'Create New World',
            centered: true,
            children: (
                <TextInput
                    label={'World Name'}
                    placeholder={'My New World'}
                    data-autofocus
                    onChange={(e) => nameInput = e.target.value}
                />
            ),
            labels: {confirm: 'Create', cancel: 'Cancel'},
            onConfirm: async () => {
                try {
                    const world = await createWorld(nameInput || 'New World');
                    await refreshWorlds();
                    onWorldSelect(world);
                } catch (e) {
                    showError("Failed to create world");
                }
            }
        });
    };

    // 3. Delete Logic
    const openDeleteModal = (world: World) => {
        modals.openConfirmModal({
            title: 'Delete Campaign',
            centered: true,
            children: `Are you sure you want to delete "${world.name}"? This cannot be undone.`,
            labels: {confirm: 'Delete', cancel: 'Cancel'},
            confirmProps: {color: 'red'},
            onConfirm: async () => {
                await deleteWorld(world.id);
                await refreshWorlds();
                showSuccess("World deleted");
            }
        });
    };

    /* ================= Render ================= */
    return (
        <Container size={'lg'} py={'xl'}>
            <Stack align={'center'} mb={50}>
                <Title order={1} size={48} fw={900}>RED MARKETS SIMULATOR</Title>
                <Text c={'dimmed'} size={'lg'}>Select a campaign to begin
                    simulation</Text>
            </Stack>

            <SimpleGrid cols={{base: 1, sm: 2, md: 3}} spacing={'lg'}>

                {/* A. Existing Worlds */}
                {worlds.map(world => (
                    <Card key={world.id} shadow={'sm'} padding={'lg'} radius={'md'}
                          withBorder={true}>
                        <Card.Section>
                            <div style={{
                                height: 120,
                                backgroundColor: 'var(--mantine-color-dark-6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Text size={'4rem'}>🌍</Text>
                            </div>
                        </Card.Section>

                        <Group justify={'space-between'} mt={'md'} mb={'xs'}>
                            <Text fw={500} truncate={true}>{world.name}</Text>
                            <Badge color={'pink'} variant={'light'}>
                                {new Date(world.createdAt).toLocaleDateString()}
                            </Badge>
                        </Group>

                        <Text size={'sm'} c={'dimmed'} mb={'md'} lineClamp={2}>
                            {world.notes || "No description available."}
                        </Text>

                        <Group mt={'md'}>
                            <Button flex={1} color={'blue'}
                                    onClick={() => onWorldSelect(world)}>
                                Load
                            </Button>
                            <Button
                                color={'red'}
                                variant={'light'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteModal(world);
                                }}
                            >
                                Delete
                            </Button>
                        </Group>
                    </Card>
                ))}

                {/* B. Create New Card */}
                <Card
                    shadow={'sm'}
                    padding={'lg'}
                    radius={'md'}
                    withBorder={true}
                    style={{
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        minHeight: 300
                    }}
                    onClick={openCreateModal}
                >
                    <Stack align={'center'} gap={'xs'}>
                        <ThemeIcon size={60} radius={'xl'} variant={'light'}
                                   color={'gray'}>
                            <Text size={'2rem'}>+</Text>
                        </ThemeIcon>
                        <Text fw={700} c={'dimmed'}>Create New Campaign</Text>
                    </Stack>
                </Card>

            </SimpleGrid>
        </Container>
    );
}