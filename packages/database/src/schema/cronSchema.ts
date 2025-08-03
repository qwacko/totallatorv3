import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Schema for tracking cron job definitions and their configuration
 */
export const cronJob = pgTable('cronJob', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	description: text('description'),
	schedule: text('schedule').notNull(), // Cron expression
	isEnabled: boolean('isEnabled').notNull().default(true),
	timeoutMs: integer('timeoutMs').notNull().default(120000), // 2 minutes default
	maxRetries: integer('maxRetries').notNull().default(0),
	
	// Metadata
	createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
	createdBy: text('createdBy').notNull().default('system'),
	lastModifiedBy: text('lastModifiedBy').notNull().default('system'),
});

/**
 * Schema for tracking individual cron job executions and their results
 */
export const cronJobExecution = pgTable('cronJobExecution', {
	id: uuid('id').primaryKey().defaultRandom(),
	cronJobId: uuid('cronJobId').notNull().references(() => cronJob.id, { onDelete: 'cascade' }),
	
	// Execution details
	startedAt: timestamp('startedAt', { withTimezone: true }).notNull().defaultNow(),
	completedAt: timestamp('completedAt', { withTimezone: true }),
	durationMs: integer('durationMs'),
	
	// Status and results
	status: text('status').notNull().default('running'), // 'running', 'completed', 'failed', 'timeout'
	exitCode: integer('exitCode'),
	output: text('output'), // Success output or error message
	errorMessage: text('errorMessage'),
	stackTrace: text('stackTrace'),
	
	// Execution context
	triggeredBy: text('triggeredBy').notNull().default('scheduler'), // 'scheduler', 'manual', 'api'
	triggeredByUserId: text('triggeredByUserId'), // For manual triggers
	retryCount: integer('retryCount').notNull().default(0),
	
	// Performance metrics
	memoryUsageMb: integer('memoryUsageMb'),
	cpuUsagePercent: integer('cpuUsagePercent'),
});

/**
 * Schema for storing cron job configuration and settings
 */
export const cronJobConfig = pgTable('cronJobConfig', {
	id: uuid('id').primaryKey().defaultRandom(),
	key: text('key').notNull().unique(),
	value: text('value').notNull(),
	description: text('description'),
	
	// Metadata
	createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
});

export type CronJob = typeof cronJob.$inferSelect;
export type CronJobInsert = typeof cronJob.$inferInsert;
export type CronJobExecution = typeof cronJobExecution.$inferSelect;
export type CronJobExecutionInsert = typeof cronJobExecution.$inferInsert;
export type CronJobConfig = typeof cronJobConfig.$inferSelect;
export type CronJobConfigInsert = typeof cronJobConfig.$inferInsert;