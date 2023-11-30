import type { CreateTagSchemaType } from '$lib/schema/tagSchema';
import { getRandomInteger } from '../misc/getRandom';

export const createTag = (): CreateTagSchemaType => {
	return {
		title: `TagGroup${getRandomInteger(40)}:TagSingle${getRandomInteger(500)}`,
		status: 'active'
	};
};
