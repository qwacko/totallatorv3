export type RealtimeProcessStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export type RealtimeEntityType = 'import' | 'backup' | 'autoImport' | 'system';

export type RealtimeLongProcess = {
	jobId: string;
	processType: string;
	status: RealtimeProcessStatus;
	progress: number;
	label: string;
	message?: string;
	entityType?: RealtimeEntityType;
	entityId?: string;
	startedAt: string;
	updatedAt: string;
	completedAt?: string;
	error?: string;
};

export type RealtimeWriteLock = {
	enabled: boolean;
	locked: boolean;
	jobId?: string;
	processType?: string;
	reason?: string;
	startedAt?: string;
	expiresAt?: string;
	owner?: string;
};

export type RealtimeSnapshot = {
	writeLock: RealtimeWriteLock;
	activeLongProcesses: RealtimeLongProcess[];
	latestLongProcess: RealtimeLongProcess | null;
};

export type RealtimeEventMap = {
	'system.snapshot': RealtimeSnapshot;
	'write_lock.changed': RealtimeWriteLock;
	'long_process.started': RealtimeLongProcess;
	'long_process.progress': RealtimeLongProcess;
	'long_process.completed': RealtimeLongProcess;
	'long_process.failed': RealtimeLongProcess;
	'system.heartbeat': {
		timestamp: string;
	};
};
