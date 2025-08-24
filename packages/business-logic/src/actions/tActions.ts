import { accountActions } from './accountActions';
import { associatedInfoActions } from './associatedInfoActions';
import { auth } from './authActions';
import { autoImportActions } from './autoImportActions';
import { backupActions } from './backupActions';
import { billActions } from './billActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import * as cronExecutionActions from './cronExecutionActions';
import * as cronJobActions from './cronJobActions';
import { fileActions } from './fileActions';
import { importActions } from './importActions';
import { importMappingActions } from './importMappingActions';
import { journalActions } from './journalActions';
import { journalLlmSuggestionActions } from './journalLlmSuggestionActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';
import { labelActions } from './labelActions';
import { llmActions } from './llmActions';
import { llmLogActions } from './llmLogActions';
import { materializedViewActions } from './materializedViewActions';
import { noteActions } from './noteActions';
import { queryLogActions } from './queryLogActions';
import { reportActions } from './reportActions';
import { reusableFilterActions } from './reusableFilterActions';
import { tagActions } from './tagActions';
import { userActions } from './userActions';

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
	materializedViews: materializedViewActions,
	user: userActions,
	autoImport: autoImportActions,
	note: noteActions,
	file: fileActions,
	queryLog: queryLogActions,
	associatedInfo: associatedInfoActions,
	llm: llmActions,
	llmLog: llmLogActions,
	journalLlmSuggestion: journalLlmSuggestionActions,
	auth: auth,
	cronJob: cronJobActions,
	cronExecution: cronExecutionActions
};
