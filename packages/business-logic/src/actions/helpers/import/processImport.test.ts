import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processCreatedImport } from './processImport';

type ImportType = 'account' | 'tag' | 'journalUpdate';

let currentImportType: ImportType = 'account';
let importProcessItemsArgs: any[] = [];
let currentImportCheckImportedOnly = true;

vi.mock('@totallator/context', () => ({
	getContextDB: () => ({
		select: () => ({
			from: () => ({
				where: () => ({})
			})
		}),
		update: () => ({
			set: () => ({
				where: () => ({})
			})
		})
	})
}));

vi.mock('../../../server/files/fileHandler', () => ({
	importFileHandler: () => ({
		readToString: async () => 'id,title\nrow-1,Row 1'
	})
}));

vi.mock('../../importMappingActions', () => ({
	importMappingActions: {
		getById: async () => undefined
	}
}));

vi.mock('./importProcessItems', () => ({
	importProcessItems: async (args: any) => {
		importProcessItemsArgs.push(args);
	}
}));

vi.mock('./getImportDetail', () => ({
	getImportDetail: async () => ({
		linkedItemStatus: {
			error: 0,
			importError: 0,
			duplicate: 0,
			processed: 1,
			imported: 0,
			all: 1
		}
	})
}));

vi.mock('../../../server/db/dbLogger', () => ({
	dbExecuteLogger: async (_query: any, label: string) => {
		if (label === 'getImportData') {
			return [
				{
					id: 'import-1',
					filename: 'import.csv',
					status: 'created',
					source: 'csv',
					type: currentImportType,
					checkImportedOnly: currentImportCheckImportedOnly,
					importMappingId: null
				}
			];
		}
		if (label === 'checkImportDuplicates - account') {
			return [{ id: 'account-1', accountTitleCombined: 'Assets:Cash:Cash Wallet' }];
		}
		if (label === 'checkImportDuplicates - tag') {
			return [{ id: 'tag-1', title: 'Groceries' }];
		}
		return [];
	}
}));

describe('processCreatedImport duplicate key callbacks', () => {
	beforeEach(() => {
		importProcessItemsArgs = [];
		currentImportCheckImportedOnly = true;
	});

	it('allows account imports with existing ids to proceed as updates', async () => {
		currentImportType = 'account';
		currentImportCheckImportedOnly = false;

		await processCreatedImport({ id: 'import-1' });

		expect(importProcessItemsArgs).toHaveLength(1);
		const checkUniqueIdentifiers = importProcessItemsArgs[0].checkUniqueIdentifiers as (
			values: string[]
		) => Promise<string[]>;

		await expect(checkUniqueIdentifiers(['id:account-1'])).resolves.toEqual([]);
		await expect(checkUniqueIdentifiers(['Assets:Cash:Cash Wallet'])).resolves.toEqual([
			'Assets:Cash:Cash Wallet'
		]);
	});

	it('allows tag imports with existing ids to proceed as updates', async () => {
		currentImportType = 'tag';
		currentImportCheckImportedOnly = false;

		await processCreatedImport({ id: 'import-1' });

		expect(importProcessItemsArgs).toHaveLength(1);
		const checkUniqueIdentifiers = importProcessItemsArgs[0].checkUniqueIdentifiers as (
			values: string[]
		) => Promise<string[]>;

		await expect(checkUniqueIdentifiers(['id:tag-1'])).resolves.toEqual([]);
		await expect(checkUniqueIdentifiers(['Groceries'])).resolves.toEqual(['Groceries']);
	});

	it('builds journalUpdate unique identifier using id prefix', async () => {
		currentImportType = 'journalUpdate';

		await processCreatedImport({ id: 'import-1' });

		expect(importProcessItemsArgs).toHaveLength(1);
		expect(importProcessItemsArgs[0].getUniqueIdentifier({ id: 'journal-1' })).toBe('id:journal-1');
	});
});
