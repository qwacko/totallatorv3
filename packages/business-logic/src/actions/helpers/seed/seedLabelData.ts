import type { CreateLabelSchemaType } from '@totallator/shared';

import { getRandomInteger } from '../misc/getRandom';

export const createLabel = (): CreateLabelSchemaType => {
	return {
		title: `LabelTitle${getRandomInteger(500)}`,
		status: 'active'
	};
};
