import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importAccount, importCategory, importLabel, importTag } from './importHelpers';

const importItemMock = vi.fn();
const accountUpdateMock = vi.fn();
const accountCreateMock = vi.fn();
const categoryUpdateMock = vi.fn();
const categoryCreateMock = vi.fn();
const tagUpdateMock = vi.fn();
const tagCreateMock = vi.fn();
const labelUpdateMock = vi.fn();
const labelCreateMock = vi.fn();

vi.mock('./importItem', () => ({
	importItem: (args: any) => importItemMock(args)
}));

vi.mock('@/actions/accountActions', () => ({
	accountActions: {
		update: (args: any) => accountUpdateMock(args),
		create: (args: any) => accountCreateMock(args)
	}
}));

vi.mock('@/actions/categoryActions', () => ({
	categoryActions: {
		update: (args: any) => categoryUpdateMock(args),
		create: (args: any) => categoryCreateMock(args)
	}
}));

vi.mock('@/actions/tagActions', () => ({
	tagActions: {
		update: (args: any) => tagUpdateMock(args),
		create: (args: any) => tagCreateMock(args)
	}
}));

vi.mock('@/actions/labelActions', () => ({
	labelActions: {
		update: (args: any) => labelUpdateMock(args),
		create: (args: any) => labelCreateMock(args)
	}
}));

vi.mock('@/actions/billActions', () => ({ billActions: { create: vi.fn() } }));
vi.mock('@/actions/budgetActions', () => ({ budgetActions: { create: vi.fn() } }));
vi.mock('@/server/db/dbLogger', () => ({ dbExecuteLogger: async (fn: any) => fn }));

const createTrx = ({ accountFound, categoryFound, tagFound, labelFound }: any) =>
	({
		query: {
			account: { findFirst: vi.fn(async () => accountFound) },
			category: { findFirst: vi.fn(async () => categoryFound) },
			tag: { findFirst: vi.fn(async () => tagFound) },
			label: { findFirst: vi.fn(async () => labelFound) }
		}
	}) as any;

const itemBase = {
	id: 'import-detail-1',
	importId: 'import-1'
} as any;

describe('importHelpers upsert behavior', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		importItemMock.mockImplementation(async ({ createItem }: any) =>
			createItem({ item: {}, db: {} })
		);
	});

	it('updates existing account when id is provided and found', async () => {
		const trx = createTrx({ accountFound: { id: 'acc-1' } });
		importItemMock.mockImplementation(async ({ createItem, db }: any) =>
			createItem({ item: { id: 'acc-1', title: 'Updated' }, db })
		);

		await importAccount({ item: itemBase, trx });

		expect(accountUpdateMock).toHaveBeenCalledWith({
			id: 'acc-1',
			data: { id: 'acc-1', title: 'Updated' }
		});
		expect(accountCreateMock).not.toHaveBeenCalled();
	});

	it('creates account when id is provided but no matching row is found', async () => {
		const trx = createTrx({ accountFound: undefined });
		accountCreateMock.mockResolvedValue('acc-new');
		importItemMock.mockImplementation(async ({ createItem, db }: any) =>
			createItem({ item: { id: 'acc-missing', title: 'New' }, db })
		);

		await importAccount({ item: itemBase, trx });

		expect(accountUpdateMock).toHaveBeenCalled();
		expect(accountCreateMock).toHaveBeenCalled();
	});

	it('updates by id for category, tag, and label imports', async () => {
		const trx = createTrx({
			categoryFound: { id: 'cat-1' },
			tagFound: { id: 'tag-1' },
			labelFound: { id: 'label-1' }
		});

		importItemMock.mockImplementation(async ({ createItem, db }: any) =>
			createItem({ item: { id: 'entity-1', title: 'Updated' }, db })
		);

		await importCategory({ item: itemBase, trx });
		await importTag({ item: itemBase, trx });
		await importLabel({ item: itemBase, trx });

		expect(categoryUpdateMock).toHaveBeenCalled();
		expect(tagUpdateMock).toHaveBeenCalled();
		expect(labelUpdateMock).toHaveBeenCalled();
		expect(categoryCreateMock).not.toHaveBeenCalled();
		expect(tagCreateMock).not.toHaveBeenCalled();
		expect(labelCreateMock).not.toHaveBeenCalled();
	});
});
