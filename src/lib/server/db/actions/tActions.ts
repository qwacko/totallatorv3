import { accountActions } from './accountActions';
import { backupActions } from './backupActions';
import { billActions } from './billActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import { importActions } from './importActions';
import { importMappingActions } from './importMappingActions';
import { journalActions } from './journalActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';
import { labelActions } from './labelActions';
import { reportActions } from './reportActions';
import { reusableFilterActions } from './reusableFilterActions';
import { tagActions } from './tagActions';

export const tActions = {
	tag: tagActions,
	category: categoryActions,
	bill: billActions,
	budget: budgetActions,
	label: labelActions,
	account: accountActions,
	journal: journalActions,
	import: importActions,
	reusableFitler: reusableFilterActions,
	importMapping: importMappingActions,
	backup: backupActions,
	report: reportActions,
	journalView: journalMaterializedViewActions,
};
