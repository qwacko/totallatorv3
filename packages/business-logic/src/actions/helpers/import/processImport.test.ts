import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processCreatedImport } from './processImport';

type ImportType = 'account' | 'tag' | 'journalUpdate';

let currentImportType: ImportType = 'account';
let importProcessItemsArgs: any[] = [];

vi.mock('@totallator/context', () => ({
	getContextDB: () => ({
		select: () => ({
			from: () => ({
				where: () => ({})
			})
		})
	})
}));

vi.mock('@/server/files/fileHandler', () => ({
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

vi.mock('@/server/db/dbLogger', () => ({
	dbExecuteLogger: async (_query: any, label: string) => {
		if (label === 'getImportData') {
			return [
				{
					id: 'import-1',
					filename: 'import.csv',
					status: 'created',
					source: 'csv',
					type: currentImportType,
					checkImportedOnly: true,
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
	});

	it('normalizes account duplicate keys for id-based and title-based identifiers', async () => {
		currentImportType = 'account';

		await processCreatedImport({ id: 'import-1' });

		expect(importProcessItemsArgs).toHaveLength(1);
		const checkUniqueIdentifiers = importProcessItemsArgs[0].checkUniqueIdentifiers as (
			values: string[]
		) => Promise<string[]>;

		await expect(checkUniqueIdentifiers(['id:account-1'])).resolves.toEqual(['id:account-1']);
		await expect(checkUniqueIdentifiers(['Assets:Cash:Cash Wallet'])).resolves.toEqual([
			'Assets:Cash:Cash Wallet'
		]);
	});

	it('normalizes tag duplicate keys for id-based and title-based identifiers', async () => {
		currentImportType = 'tag';

		await processCreatedImport({ id: 'import-1' });

		expect(importProcessItemsArgs).toHaveLength(1);
		const checkUniqueIdentifiers = importProcessItemsArgs[0].checkUniqueIdentifiers as (
			values: string[]
		) => Promise<string[]>;

		await expect(checkUniqueIdentifiers(['id:tag-1'])).resolves.toEqual(['id:tag-1']);
		await expect(checkUniqueIdentifiers(['Groceries'])).resolves.toEqual(['Groceries']);
	});

	it('builds journalUpdate unique identifier using id prefix', async () => {
		currentImportType = 'journalUpdate';

		await processCreatedImport({ id: 'import-1' });

		expect(importProcessItemsArgs).toHaveLength(1);
		expect(importProcessItemsArgs[0].getUniqueIdentifier({ id: 'journal-1' })).toBe('id:journal-1');
	});
});
