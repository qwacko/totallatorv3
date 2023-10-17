import type { CreateLabelSchemaType } from '$lib/schema/labelSchema';
import { getRandomInteger } from './getRandom';

export const createLabel = (): CreateLabelSchemaType => {
	return {
		title: `LabelTitle${getRandomInteger(500)}`,
		status: 'active'
	};
};
