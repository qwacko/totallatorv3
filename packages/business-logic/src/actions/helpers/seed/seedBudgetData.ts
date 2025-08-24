import type { CreateBudgetSchemaType } from '@totallator/shared';

import { getRandomInteger } from '../misc/getRandom';

export const createBudget = (): CreateBudgetSchemaType => {
	return {
		title: `BudgetTitle${getRandomInteger(500)}`,
		status: 'active'
	};
};
