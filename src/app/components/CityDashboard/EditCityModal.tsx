import {useState} from 'react';
import {Modal, Group, Button, Stack} from '@mantine/core';
import {type City} from '../../common/types';
import {updateCity} from '../../services/cityService';
import CityBasicInfoForm from './CityBasicInfoForm';

interface EditCityModalProps {
    opened: boolean;
    onClose: () => void;
    city: City;
    onSaved: () => void;
}

export default function EditCityModal({opened, onClose, city, onSaved}: Readonly<EditCityModalProps>) {
    const [formData, setFormData] = useState<Partial<City>>(city);

    const handleSave = async () => {
        await updateCity(city.id, {
            name: formData.name?.trim(),
            population: formData.population,
            techLevel: formData.techLevel,
            defense: formData.defense,
            notes: formData.notes || null,
            exports: formData.exports,
            imports: formData.imports,
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
                <CityBasicInfoForm 
                    values={formData} 
                    onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))} 
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

