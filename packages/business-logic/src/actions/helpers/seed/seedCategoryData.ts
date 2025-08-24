import type { CreateCategorySchemaType } from '@totallator/shared';

import { getRandomInteger } from '../misc/getRandom';

export const createCategory = (): CreateCategorySchemaType => {
	return {
		title: `CatGroup${getRandomInteger(40)}:CatSingle${getRandomInteger(500)}`,
		status: 'active'
	};
};
