import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getContext, getContextDB } from '@totallator/context';
import {
	importTable,
	reusableFilter,
	transaction,
	transactionChange,
	type TransactionChangeTableType,
	type DBType
} from '@totallator/database';
import {
	transactionHistorySnapshotSchema,
	type TransactionHistorySnapshotType,
	type TransactionChangeSourceType
} from '@totallator/shared';

import { dbExecuteLogger } from '../server/db/dbLogger';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { updatedTime } from './helpers/misc/updatedTime';

export type AuditSourceInput = {
	sourceType?: TransactionChangeSourceType;
	importId?: string | null;
	importDetailId?: string | null;
	importTitle?: string | null;
	filterId?: string | null;
	filterTitle?: string | null;
	summary?: string | null;
};

const toStableString = (value: unknown): string => {
	if (value === null || value === undefined) {
		return String(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map((item) => toStableString(item)).join(',')}]`;
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
			left.localeCompare(right)
		);
		return `{${entries.map(([key, item]) => `${key}:${toStableString(item)}`).join(',')}}`;
	}
	return JSON.stringify(value);
};

const collectChangedPaths = (beforeValue: unknown, afterValue: unknown, prefix = ''): string[] => {
	if (toStableString(beforeValue) === toStableString(afterValue)) {
		return [];
	}

	if (
		beforeValue === null ||
		beforeValue === undefined ||
		afterValue === null ||
		afterValue === undefined ||
		typeof beforeValue !== 'object' ||
		typeof afterValue !== 'object' ||
		Array.isArray(beforeValue) ||
		Array.isArray(afterValue)
	) {
		return [prefix || 'root'];
	}

	const keys = [...new Set([...Object.keys(beforeValue), ...Object.keys(afterValue)])].sort();
	return keys.flatMap((key) =>
		collectChangedPaths(
			(beforeValue as Record<string, unknown>)[key],
			(afterValue as Record<string, unknown>)[key],
			prefix ? `${prefix}.${key}` : key
		)
	);
};

const getSourceType = ({
	sourceType,
	importId,
	filterId
}: AuditSourceInput): TransactionChangeSourceType => {
	if (sourceType) {
		return sourceType;
	}
	if (importId) {
		return 'import';
	}
	if (filterId) {
		return 'filter';
	}
	const user = getContext().request.user;
	return user ? 'user' : 'system';
};

const resolveMetadata = async ({
	db,
	source
}: {
	db: DBType;
	source?: AuditSourceInput;
}) => {
	const user = getContext().request.user;
	const actorUserId = user?.id || null;
	const actorUserName = user?.name || user?.username || null;

	let sourceImportTitle = source?.importTitle ?? null;
	if (!sourceImportTitle && source?.importId) {
		const importInfo = await dbExecuteLogger(
			db.query.importTable.findFirst({
				where: eq(importTable.id, source.importId),
				columns: { title: true }
			}),
			'Transaction Change - Resolve Import Title'
		);
		sourceImportTitle = importInfo?.title || null;
	}

	let sourceFilterTitle = source?.filterTitle ?? null;
	if (!sourceFilterTitle && source?.filterId) {
		const filterInfo = await dbExecuteLogger(
			db.query.reusableFilter.findFirst({
				where: eq(reusableFilter.id, source.filterId),
				columns: { title: true }
			}),
			'Transaction Change - Resolve Filter Title'
		);
		sourceFilterTitle = filterInfo?.title || null;
	}

	return {
		actorUserId,
		actorUserName,
		sourceImportTitle,
		sourceFilterTitle,
		sourceType: getSourceType(source ?? {})
	};
};

export const buildTransactionSnapshots = async ({
	db,
	transactionIds
}: {
	db: DBType;
	transactionIds: string[];
}): Promise<Record<string, TransactionHistorySnapshotType>> => {
	if (transactionIds.length === 0) {
		return {};
	}

	const transactions = await dbExecuteLogger(
		db.query.transaction.findMany({
			where: inArrayWrapped(transaction.id, transactionIds),
			with: {
				journals: {
					with: {
						account: { columns: { id: true, accountTitleCombined: true } },
						bill: { columns: { id: true, title: true } },
						budget: { columns: { id: true, title: true } },
						category: { columns: { id: true, title: true } },
						tag: { columns: { id: true, title: true } },
						labels: {
							with: {
								label: {
									columns: {
										id: true,
										title: true
									}
								}
							}
						}
					}
				}
			}
		}),
		'Transaction Change - Build Snapshots'
	);

	return Object.fromEntries(
		transactions.map((currentTransaction) => {
			const parsed = transactionHistorySnapshotSchema.parse({
				transactionId: currentTransaction.id,
				journals: currentTransaction.journals
					.map((journal) => ({
						id: journal.id,
						importId: journal.importId,
						importDetailId: journal.importDetailId,
						amount: journal.amount,
						description: journal.description,
						dateText: journal.dateText,
						linked: journal.linked,
						reconciled: journal.reconciled,
						dataChecked: journal.dataChecked,
						complete: journal.complete,
						transfer: journal.transfer,
						account: {
							id: journal.account?.id || journal.accountId || null,
							title: journal.account?.accountTitleCombined || null
						},
						bill: {
							id: journal.bill?.id || journal.billId || null,
							title: journal.bill?.title || null
						},
						budget: {
							id: journal.budget?.id || journal.budgetId || null,
							title: journal.budget?.title || null
						},
						category: {
							id: journal.category?.id || journal.categoryId || null,
							title: journal.category?.title || null
						},
						tag: {
							id: journal.tag?.id || journal.tagId || null,
							title: journal.tag?.title || null
						},
						labels: journal.labels
							.map((labelLink) => ({
								id: labelLink.label?.id || null,
								title: labelLink.label?.title || null
							}))
							.sort((left, right) =>
								`${left.title || ''}:${left.id || ''}`.localeCompare(
									`${right.title || ''}:${right.id || ''}`
								)
							)
					}))
					.sort((left, right) => left.id.localeCompare(right.id))
			});
			return [currentTransaction.id, parsed];
		})
	);
};

export const transactionChangeActions = {
	listByTransactionId: async ({
		transactionId
	}: {
		transactionId: string;
	}): Promise<TransactionChangeTableType[]> => {
		const db = getContextDB();
		return await dbExecuteLogger(
			db
				.select()
				.from(transactionChange)
				.where(eq(transactionChange.transactionId, transactionId))
				.orderBy(desc(transactionChange.createdAt)),
			'Transaction Change - List By Transaction Id'
		);
	},
	listByImportId: async ({
		importId
	}: {
		importId: string;
	}): Promise<TransactionChangeTableType[]> => {
		const db = getContextDB();
		return await dbExecuteLogger(
			db
				.select()
				.from(transactionChange)
				.where(eq(transactionChange.sourceImportId, importId))
				.orderBy(desc(transactionChange.createdAt)),
			'Transaction Change - List By Import Id'
		);
	},
	recordChanges: async ({
		db,
		transactionIds,
		changeType,
		beforeSnapshots = {},
		afterSnapshots = {},
		source
	}: {
		db: DBType;
		transactionIds: string[];
		changeType: 'create' | 'update' | 'delete';
		beforeSnapshots?: Record<string, TransactionHistorySnapshotType>;
		afterSnapshots?: Record<string, TransactionHistorySnapshotType>;
		source?: AuditSourceInput;
	}): Promise<void> => {
		const uniqueTransactionIds = [...new Set(transactionIds)];
		if (uniqueTransactionIds.length === 0) {
			return;
		}

		const metadata = await resolveMetadata({ db, source });
		const now = new Date();

		await dbExecuteLogger(
			db.insert(transactionChange).values(
				uniqueTransactionIds.map((transactionId) => {
					const beforeSnapshot = beforeSnapshots[transactionId] || null;
					const afterSnapshot = afterSnapshots[transactionId] || null;
					return {
						id: nanoid(),
						transactionId,
						changeType,
						sourceType: metadata.sourceType,
						actorUserId: metadata.actorUserId,
						actorUserName: metadata.actorUserName,
						sourceImportId: source?.importId || null,
						sourceImportTitle: metadata.sourceImportTitle,
						sourceImportDetailId: source?.importDetailId || null,
						sourceFilterId: source?.filterId || null,
						sourceFilterTitle: metadata.sourceFilterTitle,
						summary: source?.summary || null,
						changedFields:
							changeType === 'update' ? collectChangedPaths(beforeSnapshot, afterSnapshot) : null,
						beforeSnapshot,
						afterSnapshot,
						createdAt: now,
						...updatedTime()
					};
				})
			),
			'Transaction Change - Record Changes'
		);
	}
};

export type TransactionHistoryItemType = Awaited<
	ReturnType<typeof transactionChangeActions.listByTransactionId>
>[number];
