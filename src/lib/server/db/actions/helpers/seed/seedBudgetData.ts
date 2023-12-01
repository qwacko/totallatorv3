import type { CreateBudgetSchemaType } from '$lib/schema/budgetSchema';
import { getRandomInteger } from '../misc/getRandom';

export const createBudget = (): CreateBudgetSchemaType => {
	return {
		title: `BudgetTitle${getRandomInteger(500)}`,
		status: 'active'
	};
};
