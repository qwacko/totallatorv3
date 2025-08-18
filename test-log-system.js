#!/usr/bin/env node

// Test the complete logging system

import { initializeLogDatabase, LogDatabaseOperations } from './packages/logDatabase/dist/index.js';

async function testLogSystem() {
  console.log('🧪 Testing Complete Log System...');
  
  try {
    // Initialize database
    await initializeLogDatabase({ url: 'file:./test-system-logs.db' });
    console.log('✅ Database initialized');
    
    // Create operations instance
    const ops = new LogDatabaseOperations();
    
    // Initialize configuration
    await ops.initLogConfiguration();
    console.log('✅ Configuration initialized');
    
    // Add some test logs
    const testLogs = [
      {
        date: new Date(),
        logLevel: 'INFO',
        domain: 'server',
        action: 'Create',
        code: 'SRV001', 
        title: 'Server startup complete',
        contextId: 'startup-123'
      },
      {
        date: new Date(),
        logLevel: 'WARN',
        domain: 'auth',
        action: 'Read',
        code: 'AUTH001',
        title: 'Suspicious login attempt',
        contextId: 'auth-456',
        data: { ip: '192.168.1.100', attempts: 3 }
      },
      {
        date: new Date(),
        logLevel: 'ERROR',
        domain: 'database',
        action: 'Update',
        code: 'DB001',
        title: 'Connection timeout',
        contextId: 'db-789'
      }
    ];
    
    // Insert test logs
    for (const log of testLogs) {
      await ops.insertLog(log);
    }
    console.log('✅ Test logs inserted');
    
    // Test querying
    console.log('\n🔍 Testing Queries:');
    
    // All logs
    const allLogs = await ops.getLogs();
    console.log(`📊 Total logs: ${allLogs.length}`);
    
    // Filter by domain
    const serverLogs = await ops.getLogs({ domain: 'server' });
    console.log(`🖥️  Server logs: ${serverLogs.length}`);
    
    // Filter by level
    const errorLogs = await ops.getLogs({ logLevel: 'ERROR' });
    console.log(`❌ Error logs: ${errorLogs.length}`);
    
    // Filter by action
    const createLogs = await ops.getLogs({ action: 'Create' });
    console.log(`➕ Create logs: ${createLogs.length}`);
    
    // Count queries
    const totalCount = await ops.getLogCount();
    const errorCount = await ops.getLogCount({ logLevel: 'ERROR' });
    console.log(`🔢 Total count: ${totalCount}, Error count: ${errorCount}`);
    
    // Show sample entries
    console.log('\n📋 Sample Log Entries:');
    allLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. [${log.logLevel}] ${log.domain}:${log.action} - ${log.code}: ${log.title}`);
      if (log.data) {
        console.log(`     Context: ${log.contextId}, Data: ${typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}`);
      } else {
        console.log(`     Context: ${log.contextId}`);
      }
    });
    
    // Test configuration sync
    const configMap = await ops.syncConfigurationToMemory();
    console.log(`\n⚙️  Configuration entries: ${configMap.size}`);
    console.log('Sample configs:', [...configMap.entries()].slice(0, 3));
    
    console.log('\n🎉 Complete log system test successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLogSystem();