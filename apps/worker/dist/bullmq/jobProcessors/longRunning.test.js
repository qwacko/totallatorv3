import { beforeEach, describe, expect, it, vi } from 'vitest';
const runImportLifecycleMock = vi.fn();
const executeImportLifecycleMock = vi.fn();
const autoImportTriggerMock = vi.fn();
const cleanupStagedFileMock = vi.fn();
const readStagedFileMock = vi.fn(async () => new File(['csv'], 'import.csv', { type: 'text/csv' }));
const reportProgressMock = vi.fn();
const standaloneContextMock = vi.fn(async (_requestContext, callback) => callback());
const runTrackedLongProcessMock = vi.fn(async (params) => params.run({
    jobId: 'job-1',
    reportProgress: reportProgressMock
}));
vi.mock('@totallator/bullmq', () => ({
    workerRegistry: {
        registerTyped: vi.fn()
    }
}));
vi.mock('@totallator/business-logic', () => ({
    tActions: {
        import: {
            runImportLifecycle: runImportLifecycleMock,
            executeImportLifecycle: executeImportLifecycleMock
        },
        autoImport: {
            trigger: autoImportTriggerMock
        }
    }
}));
vi.mock('../../context/workerContext', () => ({
    standaloneContext: standaloneContextMock
}));
vi.mock('../../longProcess/state', () => ({
    runTrackedLongProcess: runTrackedLongProcessMock
}));
vi.mock('../fileStaging', () => ({
    cleanupStagedFile: cleanupStagedFileMock,
    readStagedFile: readStagedFileMock
}));
describe('longRunning job processors', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('runs the full import lifecycle from the import-store processor', async () => {
        const { importStoreProcessor } = await import('./longRunning');
        const stagedFile = {
            storageKey: 'key',
            originalName: 'import.csv',
            mimeType: 'text/csv'
        };
        await importStoreProcessor({
            data: {
                data: {
                    importType: 'account',
                    autoProcess: true,
                    autoClean: false,
                    checkImportedOnly: false,
                    file: stagedFile
                }
            }
        }, {});
        expect(runTrackedLongProcessMock).toHaveBeenCalledTimes(1);
        expect(readStagedFileMock).toHaveBeenCalledWith(stagedFile);
        expect(runImportLifecycleMock).toHaveBeenCalledTimes(1);
        expect(runImportLifecycleMock.mock.calls[0][0]).toMatchObject({
            autoImportId: undefined,
            data: {
                importType: 'account',
                autoProcess: true,
                autoClean: false,
                checkImportedOnly: false
            }
        });
        expect(typeof runImportLifecycleMock.mock.calls[0][0].reportProgress).toBe('function');
        expect(cleanupStagedFileMock).toHaveBeenCalledWith(stagedFile);
    });
    it('executes the full import lifecycle from the import-trigger processor', async () => {
        const { importTriggerProcessor } = await import('./longRunning');
        await importTriggerProcessor({
            data: {
                data: {
                    importId: 'import-1'
                }
            }
        }, {});
        expect(executeImportLifecycleMock).toHaveBeenCalledWith({
            id: 'import-1',
            reportProgress: expect.any(Function)
        });
    });
    it('runs auto-import through the unified import lifecycle', async () => {
        const { autoImportTriggerProcessor } = await import('./longRunning');
        await autoImportTriggerProcessor({
            data: {
                data: {
                    autoImportId: 'auto-1'
                }
            }
        }, {
            logger: () => ({
                info: vi.fn()
            })
        });
        expect(autoImportTriggerMock).toHaveBeenCalledWith({
            id: 'auto-1',
            reportProgress: expect.any(Function)
        });
    });
});
