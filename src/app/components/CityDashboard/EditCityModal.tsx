import {useState} from 'react';
import {Modal, TextInput, NumberInput, Select, Textarea, Group, Button, Stack, TagsInput} from '@mantine/core';
import {type City, type TechLevel} from '../../common/types';
import {updateCity} from '../../services/cityService';

interface EditCityModalProps {
    opened: boolean;
    onClose: () => void;
    city: City;
    onSaved: () => void;
}

const techLevels: TechLevel[] = ['Stone', 'Iron', 'Industrial', 'Digital', 'Cutting Edge'];

export default function EditCityModal({opened, onClose, city, onSaved}: Readonly<EditCityModalProps>) {
    const [name, setName] = useState(city.name);
    const [population, setPopulation] = useState(city.population);
    const [techLevel, setTechLevel] = useState<TechLevel>(city.techLevel);
    const [defense, setDefense] = useState(city.defense);
    const [notes, setNotes] = useState(city.notes ?? '');
    const [exportsList, setExportsList] = useState(city.exports ?? []);
    const [importsList, setImportsList] = useState(city.imports ?? []);

    const handleSave = async () => {
        await updateCity(city.id, {
            name: name.trim(),
            population,
            techLevel,
            defense,
            notes: notes || null,
            exports: exportsList,
            imports: importsList
        });
        onSaved();
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Edit City"
            size="lg"
        >
            <Stack gap="md">
                <TextInput
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="City name"
                />
                <NumberInput
                    label="Population"
                    value={population}
                    onChange={(val) => setPopulation(Number(val))}
                    min={0}
                    max={999999999}
                    placeholder="Population count"
                />
                <Select
                    label="Tech Level"
                    value={techLevel}
                    onChange={(val) => val && setTechLevel(val as TechLevel)}
                    data={techLevels.map(t => ({value: t, label: t}))}
                    placeholder="Select tech level"
                />
                <NumberInput
                    label="Defense"
                    value={defense}
                    onChange={(val) => setDefense(Number(val))}
                    min={0}
                    max={100}
                    placeholder="Defense rating"
                />
                <Textarea
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.currentTarget.value)}
                    placeholder="Optional notes"
                    autosize
                />
                <TagsInput
                    label="Exports"
                    value={exportsList}
                    onChange={setExportsList}
                    placeholder="Add export tags"
                />
                <TagsInput
                    label="Imports"
                    value={importsList}
                    onChange={setImportsList}
                    placeholder="Add import tags"
                />
                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
