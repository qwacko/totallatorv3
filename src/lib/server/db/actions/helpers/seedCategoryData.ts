import type { CreateCategorySchemaType } from '$lib/schema/categorySchema';
import { getRandomInteger } from './getRandom';

export const createCategory = (): CreateCategorySchemaType => {
	return {
		title: `CatGroup${getRandomInteger(40)}:CatSingle${getRandomInteger(500)}`,
		status: 'active'
	};
};
