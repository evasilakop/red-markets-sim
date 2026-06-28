import { TextInput, NumberInput, Select, Textarea, Stack, TagsInput } from '@mantine/core';
import { type City, type TechLevel } from '../../common/types';

const techLevels: TechLevel[] = ['Stone', 'Iron', 'Industrial', 'Digital', 'Cutting Edge'];

interface CityBasicInfoFormProps {
    values: Partial<City>;
    onChange: (updates: Partial<City>) => void;
}

/**
 * Reusable form for basic city attributes.
 * Used in both EditCityModal and AddCityWizard.
 */
export default function CityBasicInfoForm({ values, onChange }: Readonly<CityBasicInfoFormProps>) {
    return (
        <Stack gap={'md'}>
            <TextInput
                label={'Name'}
                value={values.name || ''}
                onChange={(e) => onChange({ name: e.currentTarget.value })}
                placeholder={'City name'}
            />
            <NumberInput
                label={'Population'}
                value={values.population}
                onChange={(val) => onChange({ population: Number(val) })}
                min={0}
                max={999999999}
                placeholder={'Population count'}
            />
            <Select
                label={'Tech Level'}
                value={values.techLevel}
                onChange={(val) => val && onChange({ techLevel: val as TechLevel })}
                data={techLevels.map(t => ({ value: t, label: t }))}
                placeholder={'Select tech level'}
            />
            <NumberInput
                label={'Defense'}
                value={values.defense}
                onChange={(val) => onChange({ defense: Number(val) })}
                min={0}
                max={100}
                placeholder={'Defense rating'}
            />
            <Textarea
                label={'Notes'}
                value={values.notes || ''}
                onChange={(e) => onChange({ notes: e.currentTarget.value })}
                placeholder={'Optional notes'}
                autosize
            />
            <TagsInput
                label={'Exports'}
                value={values.exports || []}
                onChange={(val) => onChange({ exports: val })}
                placeholder={'Goods and services that the city exports'}
            />
            <TagsInput
                label={'Imports'}
                value={values.imports || []}
                onChange={(val) => onChange({ imports: val })}
                placeholder={'Goods and services that the city imports'}
            />
        </Stack>
    );
}
