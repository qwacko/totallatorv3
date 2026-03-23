import { and, asc, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getContextDB, getEventEmitter } from '@totallator/context';
import { agentRun, agentRunEvent } from '@totallator/database';
import type { RealtimeAgentRunEvent } from '@totallator/shared';

export type CreateAgentRunInput = {
	taskId: string;
	triggerSource?: string;
	llmSettingsId?: string;
	initiatedByUserId?: string;
	targetJournalCount?: number;
	summary?: string;
	metadata?: Record<string, unknown>;
};

export type AppendAgentRunEventInput = Omit<RealtimeAgentRunEvent, 'timestamp'>;

export const agentRunActions = {
	create: async (input: CreateAgentRunInput) => {
		const db = getContextDB();
		const id = nanoid();
		const rows = await db
			.insert(agentRun)
			.values({
				id,
				taskId: input.taskId,
				status: 'pending',
				triggerSource: input.triggerSource || null,
				llmSettingsId: input.llmSettingsId || null,
				initiatedByUserId: input.initiatedByUserId || null,
				targetJournalCount: input.targetJournalCount ?? 0,
				summary: input.summary || null,
				metadata: input.metadata || null,
				startedAt: null,
				updatedAt: new Date()
			})
			.returning();

		return rows[0];
	},

	getById: async (id: string) => {
		const db = getContextDB();
		const rows = await db.select().from(agentRun).where(eq(agentRun.id, id)).limit(1);
		return rows[0];
	},

	listRecent: async ({ taskId, limit = 25 }: { taskId?: string; limit?: number } = {}) => {
		const db = getContextDB();
		return await db
			.select()
			.from(agentRun)
			.where(taskId ? eq(agentRun.taskId, taskId) : undefined)
			.orderBy(desc(agentRun.createdAt))
			.limit(limit);
	},

	markRunning: async ({
		id,
		model,
		provider,
		promptVersion
	}: {
		id: string;
		model?: string;
		provider?: string;
		promptVersion?: string;
	}) => {
		const db = getContextDB();
		const rows = await db
			.update(agentRun)
			.set({
				status: 'running',
				model: model || null,
				provider: provider || null,
				promptVersion: promptVersion || null,
				startedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(agentRun.id, id))
			.returning();

		return rows[0];
	},

	markCompleted: async ({
		id,
		processedJournalCount,
		failureCount,
		summary
	}: {
		id: string;
		processedJournalCount?: number;
		failureCount?: number;
		summary?: string;
	}) => {
		const db = getContextDB();
		const rows = await db
			.update(agentRun)
			.set({
				status: 'completed',
				processedJournalCount: processedJournalCount ?? undefined,
				failureCount: failureCount ?? undefined,
				summary: summary ?? undefined,
				completedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(agentRun.id, id))
			.returning();

		return rows[0];
	},

	markFailed: async ({ id, summary }: { id: string; summary?: string }) => {
		const db = getContextDB();
		const current = await agentRunActions.getById(id);
		const rows = await db
			.update(agentRun)
			.set({
				status: 'failed',
				failureCount: (current?.failureCount ?? 0) + 1,
				summary: summary ?? undefined,
				completedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(agentRun.id, id))
			.returning();

		return rows[0];
	},

	appendEvent: async ({
		agentRunId,
		type,
		taskId,
		journalId,
		stepIndex,
		summary,
		data
	}: AppendAgentRunEventInput) => {
		const db = getContextDB();
		const id = nanoid();
		const timestamp = new Date();

		const rows = await db
			.insert(agentRunEvent)
			.values({
				id,
				agentRunId,
				type,
				journalId: journalId || null,
				stepIndex: stepIndex ?? null,
				summary: summary || null,
				data: data || null,
				createdAt: timestamp
			})
			.returning();

		getEventEmitter().emit('agent_run.realtime', {
			type,
			agentRunId,
			taskId,
			journalId,
			stepIndex,
			summary,
			data,
			timestamp: timestamp.toISOString()
		});

		return rows[0];
	},

	getEvents: async ({
		agentRunId,
		journalId
	}: {
		agentRunId: string;
		journalId?: string;
	}) => {
		const db = getContextDB();
		return await db
			.select()
			.from(agentRunEvent)
			.where(
				journalId
					? and(eq(agentRunEvent.agentRunId, agentRunId), eq(agentRunEvent.journalId, journalId))
					: eq(agentRunEvent.agentRunId, agentRunId)
			)
			.orderBy(asc(agentRunEvent.createdAt));
	}
};
