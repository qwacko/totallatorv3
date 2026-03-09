import { startWorkerService, stopWorkerService } from './bullmq/workerService';

const main = async () => {
	await startWorkerService();

	const shutdown = async (signal: string) => {
		console.log(`[Worker] Received ${signal}, shutting down...`);
		await stopWorkerService();
		process.exit(0);
	};

	process.on('SIGTERM', () => {
		void shutdown('SIGTERM');
	});

	process.on('SIGINT', () => {
		void shutdown('SIGINT');
	});
};

main().catch((error) => {
	console.error('[Worker] Fatal startup error', error);
	process.exit(1);
});
