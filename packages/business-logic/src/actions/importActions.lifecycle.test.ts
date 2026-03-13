import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirstMock = vi.fn();
const dbExecuteLoggerMock = vi.fn(async (query: any) => query);

vi.mock('@totallator/context', () => ({
	getContextDB: () => ({
		query: {
			importTable: {
				findFirst: findFirstMock
			}
		}
	}),
	runInTransactionWithLogging: vi.fn()
}));

vi.mock('@totallator/business-logic/server/db/dbLogger', () => ({
	dbExecuteLogger: (...args: any[]) => dbExecuteLoggerMock(...args)
}));

vi.mock('@totallator/business-logic/logger', () => ({
	getLogger: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() })
}));

describe('importActions.runImportLifecycle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('executes the full lifecycle when autoProcess is enabled', async () => {
		const { importActions } = await import('./importActions');
		const storeSpy = vi.spyOn(importActions, 'store').mockResolvedValue('import-1');
		const executeLifecycleSpy = vi
			.spyOn(importActions, 'executeImportLifecycle')
			.mockResolvedValue(undefined);

		findFirstMock
			.mockResolvedValueOnce({ id: 'import-1', autoProcess: true, status: 'processed' })
			.mockResolvedValueOnce({ id: 'import-1', status: 'complete' });

		const result = await importActions.runImportLifecycle({
			data: {} as any
		});

		expect(storeSpy).toHaveBeenCalledTimes(1);
		expect(executeLifecycleSpy).toHaveBeenCalledWith({
			id: 'import-1',
			reportProgress: undefined
		});
		expect(result).toEqual({ importId: 'import-1', status: 'complete' });
	});

	it('leaves processed imports awaiting manual execution when autoProcess is disabled', async () => {
		const { importActions } = await import('./importActions');
		const storeSpy = vi.spyOn(importActions, 'store').mockResolvedValue('import-2');
		const executeLifecycleSpy = vi
			.spyOn(importActions, 'executeImportLifecycle')
			.mockResolvedValue(undefined);

		findFirstMock
			.mockResolvedValueOnce({ id: 'import-2', autoProcess: false, status: 'processed' })
			.mockResolvedValueOnce({ id: 'import-2', status: 'processed' });

		const result = await importActions.runImportLifecycle({
			data: {} as any
		});

		expect(storeSpy).toHaveBeenCalledTimes(1);
		expect(executeLifecycleSpy).not.toHaveBeenCalled();
		expect(result).toEqual({ importId: 'import-2', status: 'processed' });
	});
});
