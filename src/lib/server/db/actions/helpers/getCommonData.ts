import { logging } from '$lib/server/logging';

export const getCommonData = <
	T extends string,
	U extends Record<T, string | number | undefined | null | Date | boolean>
>(
	key: T,
	data: U[],
	log = false
) => {
	const targetSet = [...new Set(data.map((item) => item[key]))];

	if (log) {
		logging.info('Target Set : ', targetSet, ' - Length - ', targetSet.length);
	}

	if (targetSet.length === 1) {
		return targetSet[0];
	}
	return undefined;
};

type journalsWithOtherJournalType = {
	otherJournals: { accountId: string }[];
}[];

export const getCommonOtherAccountData = <T extends journalsWithOtherJournalType>(data: T) => {
	if (data.length === 0) {
		return undefined;
	}
	const allHaveOnly1OtherJournal = data.reduce(
		(prev, current) => (current.otherJournals.length === 1 ? prev : false),
		true
	);

	if (!allHaveOnly1OtherJournal) {
		return undefined;
	}

	let returnAccount: string | undefined = data[0].otherJournals[0].accountId;

	// Iterate over the rest of the items
	for (let i = 1; i < data.length; i++) {
		for (const otherJournal of data[i].otherJournals) {
			if (returnAccount && otherJournal.accountId !== returnAccount) {
				returnAccount = undefined;
			}
		}
	}

	return returnAccount;
};

type journalsWithLabelsType = {
	labels: {
		id: string | null;
		title: string | null;
	}[];
}[];

export const getCommonLabelData = <T extends journalsWithLabelsType>(data: T) => {
	const allLabelIds = new Set<string>();
	const commonLabelIds = new Set<string>();

	if (data.length === 0) {
		return { allLabelIds: [], commonLabelIds: [] };
	}

	// Initialize commonLabelIds with the label IDs of the first item
	for (const label of data[0].labels) {
		if (label.id) {
			commonLabelIds.add(label.id);
			allLabelIds.add(label.id);
		}
	}

	// Iterate over the rest of the items
	for (let i = 1; i < data.length; i++) {
		const currentLabelIds = new Set<string>();
		for (const label of data[i].labels) {
			if (label.id) {
				currentLabelIds.add(label.id);
				allLabelIds.add(label.id);
			}
		}

		// Set intersection: Update commonLabelIds to only keep IDs that also exist in currentLabelIds
		for (const id of commonLabelIds) {
			if (!currentLabelIds.has(id)) {
				commonLabelIds.delete(id);
			}
		}
	}

	return {
		allLabelIds: [...allLabelIds],
		commonLabelIds: [...commonLabelIds]
	};
};
