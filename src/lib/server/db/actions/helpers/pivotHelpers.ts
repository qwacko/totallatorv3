import type { JournalPivotTableSchemaType, PivotTableColumnEnum } from '$lib/schema/journalSchema';

import { filterNullUndefinedAndDuplicates } from '../../../../../routes/(loggedIn)/journals/filterNullUndefinedAndDuplicates';

import { account, bill, budget, category, journalEntry, tag } from '../../schema';

export const pivotConfigToGroupBy = (config: JournalPivotTableSchemaType) => {
	const rows = filterNullUndefinedAndDuplicates([
		config.row1,
		config.row2,
		config.row3,
		config.col1,
		config.col2,
		config.col3
	]);

	return rows.map((currentRow) => pivotRowColToDBSelection(currentRow));
};

export const pivotConfigToSelection = (config: JournalPivotTableSchemaType) => {
	return {
		row1: pivotRowColToDBSelection(config.row1),
		...(config.row2 ? { row2: pivotRowColToDBSelection(config.row2) } : {}),
		...(config.row3 ? { row3: pivotRowColToDBSelection(config.row3) } : {}),
		...(config.col1 ? { col1: pivotRowColToDBSelection(config.col1) } : {}),
		...(config.col2 ? { col2: pivotRowColToDBSelection(config.col2) } : {}),
		...(config.col3 ? { col3: pivotRowColToDBSelection(config.col3) } : {})
	};
};

export const pivotRowColToDBSelection = <R extends PivotTableColumnEnum>(pivotCol: R) => {
	if (pivotCol === 'account') {
		return account.title;
	}
	if (pivotCol === 'accountGroup') {
		return account.accountGroup;
	}
	if (pivotCol === 'accountGroup2') {
		return account.accountGroup2;
	}
	if (pivotCol === 'accountGroup3') {
		return account.accountGroup3;
	}
	if (pivotCol === 'accountIsCash') {
		return account.isCash;
	}
	if (pivotCol === 'accountIsNetWorth') {
		return account.isNetWorth;
	}
	if (pivotCol === 'accountType') {
		return account.type;
	}
	if (pivotCol === 'bill') {
		return bill.title;
	}
	if (pivotCol === 'budget') {
		return budget.title;
	}
	if (pivotCol === 'category') {
		return category.title;
	}
	if (pivotCol === 'categoryGroup') {
		return category.group;
	}
	if (pivotCol === 'categorySingle') {
		return category.single;
	}
	if (pivotCol === 'tag') {
		return tag.title;
	}
	if (pivotCol === 'tagGroup') {
		return tag.group;
	}
	if (pivotCol === 'tagSingle') {
		return tag.single;
	}
	if (pivotCol === 'year') {
		return journalEntry.year;
	}
	if (pivotCol === 'yearMonth') {
		return journalEntry.yearMonth;
	}
	if (pivotCol === 'yearQuarter') {
		return journalEntry.yearQuarter;
	}
	if (pivotCol === 'yearWeek') {
		return journalEntry.yearWeek;
	}

	throw new Error("This Shouldn't happen");
};

type PivotTableSummary = {
	[col1Val: string]: {
		[col2Val: string]: {
			[col3Val: string]: number;
		};
	};
};

function countBottomLevelItems(pivotTable: PivotTableSummary): number {
	let itemCount = 0;

	for (const col1Val in pivotTable) {
		for (const col2Val in pivotTable[col1Val]) {
			for (const col3Val in pivotTable[col1Val][col2Val]) {
				itemCount++;
			}
		}
	}

	return itemCount;
}

interface PivotTableInput {
	col3?: string | boolean | null | undefined;
	col2?: string | boolean | null | undefined;
	col1?: string | boolean | null | undefined;
	row3?: string | boolean | null | undefined;
	row2?: string | boolean | null | undefined;
	row1: string | boolean | null | undefined;
	amount: number;
}

export function createPivotTableHeaders(data: PivotTableInput[]) {
	const colSummary: PivotTableSummary = {};
	const rowSummary: PivotTableSummary = {};

	for (const entry of data) {
		const { col1, col2, col3, row1, row2, row3 } = entry;

		// Initialize nested objects if they don't exist

		const useCol1 = col1 ? col1.toString() : '';
		const useCol2 = col2 ? col2.toString() : '';
		const useCol3 = col3 ? col3.toString() : '';
		const useRow1 = row1 ? row1.toString() : '';
		const useRow2 = row2 ? row2.toString() : '';
		const useRow3 = row3 ? row3.toString() : '';

		if (!colSummary[useCol1]) {
			colSummary[useCol1] = {};
		}
		if (!colSummary[useCol1][useCol2]) {
			colSummary[useCol1][useCol2] = {};
		}
		colSummary[useCol1][useCol2][useCol3] = entry.amount;

		if (!rowSummary[useRow1]) {
			rowSummary[useRow1] = {};
		}
		if (!rowSummary[useRow1][useRow2]) {
			rowSummary[useRow1][useRow2] = {};
		}
		rowSummary[useRow1][useRow2][useRow3] = entry.amount;
	}

	return {
		colSummary,
		rowSummary,
		colCount: countBottomLevelItems(colSummary),
		rowCount: countBottomLevelItems(rowSummary)
	};
}
