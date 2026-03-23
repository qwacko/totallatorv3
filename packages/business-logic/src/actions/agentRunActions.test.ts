import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	clearTestDB,
	closeTestDB,
	getTestDB,
	withTestDbContext
} from '@totallator/business-logic/server/db/test/dbTest';
import { getEventEmitter } from '@totallator/context';
import type { DBType } from '@totallator/database';

import { agentRunActions } from './agentRunActions';

describe('agentRunActions', () => {
	let dbConnection: Awaited<ReturnType<typeof getTestDB>>;
	let db: DBType;

	beforeAll(async () => {
		dbConnection = await getTestDB();
		db = dbConnection.testDB;
	}, 30000);

	beforeEach(async () => {
		await withTestDbContext(db, async () => {
			await clearTestDB(db, { refreshViews: false });
		});
	});

	afterAll(async () => {
		await closeTestDB(dbConnection);
	});

	it('creates runs and appends events', async () => {
		let emitSpy: ReturnType<typeof vi.spyOn> | undefined;

		await withTestDbContext(db, async () => {
			emitSpy = vi.spyOn(getEventEmitter(), 'emit');

			const run = await agentRunActions.create({
				taskId: 'journal-recommendation',
				triggerSource: 'manual-single',
				targetJournalCount: 1
			});

			expect(run.status).toBe('pending');

			await agentRunActions.appendEvent({
				type: 'agent_run.started',
				agentRunId: run.id,
				taskId: 'journal-recommendation',
				summary: 'Started'
			});

			const events = await agentRunActions.getEvents({ agentRunId: run.id });
			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('agent_run.started');
			expect(emitSpy).toHaveBeenCalledWith(
				'agent_run.realtime',
				expect.objectContaining({
					type: 'agent_run.started',
					agentRunId: run.id,
					taskId: 'journal-recommendation'
				})
			);
		});

		emitSpy?.mockRestore();
	});

	it('sets startedAt only when the run is marked running', async () => {
		await withTestDbContext(db, async () => {
			const run = await agentRunActions.create({
				taskId: 'journal-recommendation'
			});

			expect(run.startedAt).toBeNull();

			const running = await agentRunActions.markRunning({
				id: run.id,
				model: 'gpt-4o-mini',
				provider: 'openai'
			});

			expect(running.status).toBe('running');
			expect(running.startedAt).toBeInstanceOf(Date);
		});
	});
});
