import { billActions } from './billActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import { tagActions } from './tagActions';

export const tActions = {
	tag: tagActions,
	category: categoryActions,
	bill: billActions,
	budget: budgetActions
};
