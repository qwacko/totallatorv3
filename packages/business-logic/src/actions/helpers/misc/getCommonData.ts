import { getLogger } from '@/logger';

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
		getLogger().info('Target Set : ', targetSet, ' - Length - ', targetSet.length);
	}

	if (targetSet.length === 1) {
		return targetSet[0];
	}
	return undefined;
};

type journalsWithOtherJournalTypeAndAmount = {
	amount: number;
	accountId: string;
	otherJournals: { accountId: string; amount: number }[];
}[];

export type GetToFromAccountAmountDataReturn = {
	toAccountId: string | undefined;
	fromAccountId: string | undefined;
	toAmount: number | undefined;
	fromAmount: number | undefined;
	direction: boolean | undefined;
};

/**
 * Retrieves a common set the to and from account id and amounts for multiple journals by analysing the other journals data.
 * If there is more than 2 journals, in any transacstion then null value are returned. If there is a common to or from acounnt information
 * then this is returned.
 *
 * @template T - The type of the key.
 * @template U - The type of the objects in the data array.
 *
 * @param {T} key - The key to retrieve common data for.
 * @param {U[]} data - The array of objects to retrieve data from.
 * @param {boolean} [log=false] - Optional parameter to enable getLogger().
 *
 * @returns {U[T] | undefined} - The common data for the specified key, or undefined if there is no common data.
 */
export const getToFromAccountAmountData = <T extends journalsWithOtherJournalTypeAndAmount>(
	data: T
): GetToFromAccountAmountDataReturn => {
	if (data.length === 0) {
		return {
			toAccountId: undefined,
			fromAccountId: undefined,
			toAmount: undefined,
			fromAmount: undefined,
			direction: undefined
		};
	}

	const numberWithMoreThan1 = data.reduce(
		(prev, current) => (current.otherJournals.length > 1 ? prev + 1 : prev),
		0
	);

	if (numberWithMoreThan1 > 0) {
		return {
			toAccountId: undefined,
			fromAccountId: undefined,
			toAmount: undefined,
			fromAmount: undefined,
			direction: undefined
		};
	}

	const firstItem: GetToFromAccountAmountDataReturn =
		data[0].amount > 0
			? {
					toAccountId: data[0].accountId,
					fromAccountId: data[0].otherJournals[0].accountId,
					toAmount: data[0].amount,
					fromAmount: data[0].otherJournals[0].amount,
					direction: true
				}
			: {
					fromAccountId: data[0].accountId,
					toAccountId: data[0].otherJournals[0].accountId,
					fromAmount: data[0].amount,
					toAmount: data[0].otherJournals[0].amount,
					direction: false
				};

	const returnData = data.reduce((prev, current) => {
		if (current.amount > 0) {
			return {
				toAccountId:
					prev.toAccountId && current.accountId === prev.toAccountId ? prev.toAccountId : undefined,
				fromAccountId:
					prev.fromAccountId && current.otherJournals[0].accountId === prev.fromAccountId
						? prev.fromAccountId
						: undefined,
				toAmount:
					prev.toAmount !== undefined && current.amount === prev.toAmount
						? prev.toAmount
						: undefined,
				fromAmount:
					prev.fromAmount !== undefined && current.otherJournals[0].amount === prev.fromAmount
						? prev.fromAmount
						: undefined,
				direction:
					prev.direction !== undefined && prev.direction === true ? prev.direction : undefined
			} as GetToFromAccountAmountDataReturn;
		}
		return {
			fromAccountId:
				prev.fromAccountId && data[0].accountId === prev.fromAccountId
					? prev.fromAccountId
					: undefined,
			toAccountId:
				prev.toAccountId && current.otherJournals[0].accountId === prev.toAccountId
					? prev.toAccountId
					: undefined,
			fromAmount:
				prev.fromAmount !== undefined && current.amount === prev.fromAmount
					? prev.fromAmount
					: undefined,
			toAmount:
				prev.toAmount !== undefined && current.otherJournals[0].amount === prev.toAmount
					? prev.toAmount
					: undefined,
			direction:
				prev.direction !== undefined && prev.direction === false ? prev.direction : undefined
		} as GetToFromAccountAmountDataReturn;
	}, firstItem);

	return returnData;
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
