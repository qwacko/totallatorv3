import { urlGenerator } from '$lib/routes';
import type { importTypeType } from '$lib/schema/importSchema';
import { defaultJournalFilter } from '$lib/schema/journalSchema';

export const linkToImportItems = ({
	importId,
	importType
}: {
	importId: string;
	importType: importTypeType;
}) => {
	if (importType === 'transaction') {
		return urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...defaultJournalFilter,
				importIdArray: [importId]
			}
		}).url;
	}

	if (importType === 'account') {
		return urlGenerator({
			address: '/(loggedIn)/accounts',
			searchParamsValue: {
				importIdArray: [importId]
			}
		}).url;
	}

	if (importType === 'bill') {
		return urlGenerator({
			address: '/(loggedIn)/bills',
			searchParamsValue: {
				importIdArray: [importId]
			}
		}).url;
	}

	if (importType === 'budget') {
		return urlGenerator({
			address: '/(loggedIn)/budgets',
			searchParamsValue: {
				importIdArray: [importId]
			}
		}).url;
	}

	if (importType === 'category') {
		return urlGenerator({
			address: '/(loggedIn)/categories',
			searchParamsValue: {
				importIdArray: [importId]
			}
		}).url;
	}

	if (importType === 'label') {
		return urlGenerator({
			address: '/(loggedIn)/labels',
			searchParamsValue: {
				importIdArray: [importId]
			}
		}).url;
	}

	if (importType === 'tag') {
		return urlGenerator({
			address: '/(loggedIn)/tags',
			searchParamsValue: {
				importIdArray: [importId]
			}
		}).url;
	}

	return '';
};
