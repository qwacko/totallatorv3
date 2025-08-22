#!/usr/bin/env node
import {
	createLogger,
	deleteOldLogs,
	getLoggedItemsCount,
	initializeDatabaseLogging,
	queryLoggedItems
} from './dist/index.js';

async function testQueryLogs() {
	console.log('🔍 Testing Log Query Functions...');

	try {
		// Initialize database logging
		await initializeDatabaseLogging({ url: 'file:./test-query-logs.db' });
		console.log('✅ Database logging initialized');

		// Create a logger and generate some test data
		const logger = createLogger(
			true,
			['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
			'test-query-123'
		);

		const serverLogger = logger('server');
		const authLogger = logger('auth', 'Create');
		const importLogger = logger('import', 'Update');

		// Generate test log entries
		serverLogger.info({ code: 'SRV001', title: 'Server started successfully' });
		serverLogger.warn({
			code: 'SRV002',
			title: 'High memory usage detected',
			memory: '85%'
		});

		authLogger.info({
			code: 'AUTH001',
			title: 'User authenticated',
			userId: 'user123'
		});
		authLogger.error({
			code: 'AUTH002',
			title: 'Failed login attempt',
			ip: '192.168.1.100'
		});

		importLogger.debug({
			code: 'IMP001',
			title: 'Processing import file',
			filename: 'data.csv'
		});

		console.log('✅ Generated test log entries');

		// Wait a bit for async logging to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Query all logs
		const allLogs = await queryLoggedItems();
		console.log(`📊 Total logs: ${allLogs.length}`);

		// Query logs by domain
		const serverLogs = await queryLoggedItems({ domain: 'server' });
		console.log(`🖥️  Server logs: ${serverLogs.length}`);

		// Query logs by action
		const createLogs = await queryLoggedItems({ action: 'Create' });
		console.log(`➕ Create action logs: ${createLogs.length}`);

		// Query logs by level
		const errorLogs = await queryLoggedItems({ logLevel: 'ERROR' });
		console.log(`❌ Error logs: ${errorLogs.length}`);

		// Query logs by context
		const contextLogs = await queryLoggedItems({ contextId: 'test-query-123' });
		console.log(`🎯 Context logs: ${contextLogs.length}`);

		// Query with time range (last minute)
		const now = new Date();
		const oneMinuteAgo = new Date(now.getTime() - 60000);
		const recentLogs = await queryLoggedItems({
			startDate: oneMinuteAgo,
			endDate: now
		});
		console.log(`⏰ Recent logs (last minute): ${recentLogs.length}`);

		// Test count functionality
		const totalCount = await getLoggedItemsCount();
		console.log(`🔢 Total count: ${totalCount}`);

		// Show sample log entries
		console.log('\n📋 Sample log entries:');
		allLogs.slice(0, 3).forEach((log, i) => {
			console.log(
				`  ${i + 1}. [${log.logLevel}] ${log.domain}:${log.action} - ${log.code}: ${log.title}`
			);
			if (log.data && typeof log.data === 'object') {
				console.log(`     Data: ${JSON.stringify(log.data)}`);
			}
		});

		// Test log cleanup (delete logs older than 0 days for testing)
		const deletedCount = await deleteOldLogs(0);
		console.log(`🗑️  Deleted ${deletedCount} old log entries`);

		console.log('\n🎉 Log query test completed successfully!');
	} catch (error) {
		console.error('❌ Log query test failed:', error);
		process.exit(1);
	}
}

testQueryLogs();
