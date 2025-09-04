import { expandDate } from './actions/helpers/journal/expandDate.js';
import { journalMaterialisedList } from './actions/helpers/journal/journalList.js';
import { updateManyTransferInfo } from './actions/helpers/journal/updateTransactionTransfer.js';
import { initDBLogger } from './server/db/dbLogger.js';
import {
	getAllPredefinedProviders,
	getProviderDisplayName,
	isPredefinedProvider,
	resolveApiUrl
} from './server/llm/providerConfig.js';

export { tActions } from './actions/tActions.js';

// Export event system
export {
	initializeEventCallbacks,
	getEventListenerCounts,
	clearInProgressBackupRestores,
	getBackupRestoreProgress,
	hasActiveBackupRestore,
	emitEvent,
	canEmitEvents,
	emitMultipleEvents
} from './events/index.js';

export type TestType = string;

// Export key types that are needed by the webapp
export type { TagDropdownType } from './actions/tagActions.js';
export type { CategoryDropdownType } from './actions/categoryActions.js';
export type { BillDropdownType } from './actions/billActions.js';
export type { AccountDropdownType } from './actions/accountActions.js';
export type { ImportMappingDropdownType } from './actions/importMappingActions.js';
export type { BudgetDropdownType } from './actions/budgetActions.js';
export type { LabelDropdownType } from './actions/labelActions.js';
export type { RecommendationType } from './actions/journalMaterializedViewActions.js';
export type { TextFilterOptionsType } from './actions/helpers/misc/processTextFilter.js';
export type { JournalSummaryType } from './actions/journalMaterializedViewActions.js';
export type { AssociatedInfoDataType } from './actions/associatedInfoActions.js';
export type { GroupedFilesType } from './actions/helpers/file/listGroupedFiles.js';
export type { ImportDetail } from './actions/importActions.js';
export type { ImportDetailList } from './actions/importActions.js';
export type { ReportDropdownType } from './actions/reportActions.js';
export type { ReportElementDataForUse } from './actions/reportActions.js';
export type { ReportConfigPartWithData_NonTimeGraph } from './actions/helpers/report/getData.js';
export type { ReportConfigPartWithData_String } from './actions/helpers/report/getData.js';
export type { ReportConfigPartWithData_Sparkline } from './actions/helpers/report/getData.js';
export type { ReportElementItemData } from './actions/helpers/report/getData.js';
export type { ReportConfigPartWithData_TimeGraph } from './actions/helpers/report/getData.js';
export type { ReportConfigPartWithData_NumberCurrency } from './actions/helpers/report/getData.js';
export type { GetReportConfigResult } from './actions/reportActions.js';
export type { ReportLayoutConfigType } from './actions/reportActions.js';
export type { ReportElementData } from './actions/reportActions.js';
export type { ReusableFilterDropdownListType } from './actions/reusableFilterActions.js';
export type { AssociatedInfoLinkType } from './actions/associatedInfoActions.js';
export type { EnhancedRecommendationType } from './server/services/journalRecommendationService.js';

// Export cron-related types
export type {
	CronJobDefinition,
	CronJobResult,
	CronJobExecutionContext,
	CronJobExecutionStatus,
	CronJobExecutionFilter
} from './server/cron/types.js';

// Export functions and actions that are imported by the webapp
export {
	dbAdminCount,
	dbUserCount,
	dbNoAdmins,
	noAdmins,
	isFirstUser,
	getAdminCount,
	getUserCount
} from './actions/firstUser.js';
export { userActions } from './actions/userActions.js';
export { reusableFilterActions } from './actions/reusableFilterActions.js';

// Export key-value store utilities
export {
	keyValueStore,
	booleanKeyValueStore,
	enumKeyValueStore
} from './actions/helpers/keyValueStore.js';

// Export materialized view actions
export { materializedViewActions } from './actions/materializedViewActions.js';

// Export helper functions
export { journalFilterToText } from './actions/helpers/journal/journalFilterToQuery.js';
export { journalUpdateToText } from './actions/helpers/journal/journalUpdateToText.js';
export { importFilterToText } from './actions/helpers/import/importFilterToQuery.js';
export { reusableFilterToText } from './actions/helpers/journal/reusableFilterToQuery.js';
export { fileMainFilterArray } from './actions/helpers/file/fileTextFilter.js';
export { budgetFilterToText } from './actions/helpers/budget/budgetFilterToQuery.js';
export { budgetFilterArray } from './actions/helpers/budget/budgetTextFilter.js';
export { importMappingFilterToText } from './actions/helpers/import/importMappingFilterToQuery.js';
export { tagFilterToText } from './actions/helpers/tag/tagFilterToQuery.js';
export { tagFilterArray } from './actions/helpers/tag/tagTextFilter.js';
export { journalFilterArray } from './actions/helpers/journal/journalTextFilter.js';
export { accountFilterToText } from './actions/helpers/account/accountFilterToQuery.js';
export { accountFilterArray } from './actions/helpers/account/accountTextFilter.js';
export { billFilterToText } from './actions/helpers/bill/billFilterToQuery.js';
export { billFilterArray } from './actions/helpers/bill/billTextFilter.js';
export { labelFilterToText } from './actions/helpers/label/labelFilterToQuery.js';
export { labelFilterArray } from './actions/helpers/label/labelTextFilter.js';
export { associatedInfoFilterToText } from './actions/helpers/associatedInfo/associatedInfoFilterToQuery.js';
export { categoryFilterToText } from './actions/helpers/category/categoryFilterToQuery.js';
export { categoryFilterArray } from './actions/helpers/category/categoryTextFilter.js';

// Export cron service
export { CronJobService } from './server/cron/cronJobService';
export { cronJobDefinitions } from './server/cron/cronJobDefinitions';

export const actionHelpers = {
	expandDate,
	updateManyTransferInfo,
	journalMaterialisedList,
	getAllPredefinedProviders,
	isPredefinedProvider,
	getProviderDisplayName,
	resolveApiUrl,
	initDBLogger: initDBLogger
};

export const clientHelpers = {
	resolveApiUrl,
	getProviderDisplayName
};
