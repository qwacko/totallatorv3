import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importJournalUpdate } from './importHelpers_importTransaction';

const updateJournalsMock = vi.fn();
const dbExecuteLoggerMock = vi.fn(async (query: any) => query);

vi.mock('@totallator/business-logic/actions/journalActions', () => ({
	journalActions: {
		updateJournals: (args: any) => updateJournalsMock(args),
		createManyTransactionJournals: vi.fn()
	}
}));

vi.mock('@totallator/business-logic/logger', () => ({
	getLogger: () => ({ debug: vi.fn(), info: vi.fn(), error: vi.fn() })
}));

vi.mock('@totallator/business-logic/server/db/dbLogger', () => ({
	dbExecuteLogger: (...args: any[]) => dbExecuteLoggerMock(...args)
}));

const createTrx = ({ updatedJournal }: { updatedJournal?: any }) => {
	const updateSetCalls: any[] = [];
	const trx = {
		query: {
			journalEntry: {
				findFirst: vi.fn(async () => updatedJournal)
			}
		},
		update: vi.fn(() => ({
			set: (payload: any) => {
				updateSetCalls.push(payload);
				return {
					where: () => payload
				};
			}
		}))
	} as any;

	return { trx, updateSetCalls };
};

const buildItem = (dataToUse: any) =>
	({
		id: 'import-detail-1',
		processedInfo: { dataToUse }
	}) as any;

describe('importJournalUpdate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('marks importError when schema validation fails', async () => {
		const { trx, updateSetCalls } = createTrx({});
		const item = buildItem({ description: 'missing-id' });

		await importJournalUpdate({ item, trx });

		expect(updateJournalsMock).not.toHaveBeenCalled();
		expect(updateSetCalls[0].status).toBe('importError');
	});

	it('marks importError when updateJournals returns no updated ids', async () => {
		updateJournalsMock.mockResolvedValue([]);
		const { trx, updateSetCalls } = createTrx({});
		const item = buildItem({ id: 'journal-1', description: 'change' });

		await importJournalUpdate({ item, trx });

		expect(updateJournalsMock).toHaveBeenCalledWith({
			filter: { idArray: ['journal-1'] },
			journalData: { id: 'journal-1', description: 'change' }
		});
		expect(updateSetCalls[0].status).toBe('importError');
		expect(updateSetCalls[0].errorInfo.errors[0]).toContain('could not be applied');
	});

	it('marks imported and links relationId when journal update succeeds', async () => {
		updateJournalsMock.mockResolvedValue(['journal-1']);
		const updatedJournal = { id: 'journal-1', description: 'updated-description' };
		const { trx, updateSetCalls } = createTrx({ updatedJournal });
		const item = buildItem({ id: 'journal-1', description: 'change' });

		await importJournalUpdate({ item, trx });

		expect(updateSetCalls[0]).toMatchObject({
			status: 'imported',
			relationId: 'journal-1',
			importInfo: updatedJournal
		});
	});
});
