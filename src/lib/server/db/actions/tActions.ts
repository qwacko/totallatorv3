import { accountActions } from './accountActions';
import { billActions } from './billActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import { journalActions } from './journalActions';
import { labelActions } from './labelActions';
import { tagActions } from './tagActions';

export const tActions = {
	tag: tagActions,
	category: categoryActions,
	bill: billActions,
	budget: budgetActions,
	label: labelActions,
	account: accountActions,
	journal: journalActions
};
