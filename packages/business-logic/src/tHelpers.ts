import { accountFilterArray } from './actions/helpers/account/accountTextFilter.js';
import { accountFilterToText } from './actions/helpers/account/accountFilterToQuery.js';
import { associatedInfoFilterToText } from './actions/helpers/associatedInfo/associatedInfoFilterToQuery.js';
import { billFilterArray } from './actions/helpers/bill/billTextFilter.js';
import { billFilterToText } from './actions/helpers/bill/billFilterToQuery.js';
import { budgetFilterArray } from './actions/helpers/budget/budgetTextFilter.js';
import { budgetFilterToText } from './actions/helpers/budget/budgetFilterToQuery.js';
import { categoryFilterArray } from './actions/helpers/category/categoryTextFilter.js';
import { categoryFilterToText } from './actions/helpers/category/categoryFilterToQuery.js';
import { fileMainFilterArray } from './actions/helpers/file/fileTextFilter.js';
import { importFilterToText } from './actions/helpers/import/importFilterToQuery.js';
import { importMappingFilterToText } from './actions/helpers/import/importMappingFilterToQuery.js';
import { expandDate } from './actions/helpers/journal/expandDate.js';
import { journalMaterialisedList } from './actions/helpers/journal/journalList.js';
import { journalFilterArray } from './actions/helpers/journal/journalTextFilter.js';
import { journalFilterToText } from './actions/helpers/journal/journalFilterToQuery.js';
import { journalUpdateToText } from './actions/helpers/journal/journalUpdateToText.js';
import { reusableFilterToText } from './actions/helpers/journal/reusableFilterToQuery.js';
import { updateManyTransferInfo } from './actions/helpers/journal/updateTransactionTransfer.js';
import { labelFilterArray } from './actions/helpers/label/labelTextFilter.js';
import { labelFilterToText } from './actions/helpers/label/labelFilterToQuery.js';
import { tagFilterArray } from './actions/helpers/tag/tagTextFilter.js';
import { tagFilterToText } from './actions/helpers/tag/tagFilterToQuery.js';
import { dbNoAdmins, getAdminCount, getUserCount, noAdmins } from './actions/firstUser.js';
import { initDBLogger } from './server/db/dbLogger.js';
import {
	getAllPredefinedProviders,
	getProviderDisplayName,
	getProviderType,
	isPredefinedProvider,
	resolveApiUrl
} from './server/llm/providerConfig.js';

export const tHelpers = {
	account: { filterToText: accountFilterToText, filterArray: accountFilterArray },
	associatedInfo: { filterToText: associatedInfoFilterToText },
	bill: { filterToText: billFilterToText, filterArray: billFilterArray },
	budget: { filterToText: budgetFilterToText, filterArray: budgetFilterArray },
	category: { filterToText: categoryFilterToText, filterArray: categoryFilterArray },
	file: { filterArray: fileMainFilterArray },
	import: { filterToText: importFilterToText },
	importMapping: { filterToText: importMappingFilterToText },
	journal: {
		expandDate,
		filterToText: journalFilterToText,
		filterArray: journalFilterArray,
		updateToText: journalUpdateToText,
		reusableFilterToText,
		materialisedList: journalMaterialisedList,
		updateManyTransferInfo
	},
	label: { filterToText: labelFilterToText, filterArray: labelFilterArray },
	llmProvider: {
		getAllPredefinedProviders,
		isPredefinedProvider,
		getProviderDisplayName,
		resolveApiUrl,
		getProviderType
	},
	system: {
		initDBLogger,
		dbNoAdmins,
		noAdmins,
		getAdminCount,
		getUserCount
	},
	tag: { filterToText: tagFilterToText, filterArray: tagFilterArray }
};

export const actionHelpers = {
	expandDate,
	updateManyTransferInfo,
	journalMaterialisedList,
	getAllPredefinedProviders,
	isPredefinedProvider,
	getProviderDisplayName,
	resolveApiUrl,
	getProviderType,
	initDBLogger
};
