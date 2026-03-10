import { eq, or } from 'drizzle-orm';
import Papa from 'papaparse';
import { z } from 'zod';

import { getContextDB } from '@totallator/context';
import {
	account,
	bill,
	budget,
	category,
	importItemDetail,
	importTable,
	journalEntry,
	label,
	tag
} from '@totallator/database';
import { createSimpleTransactionSchema } from '@totallator/shared';
import { updateJournalSchema } from '@totallator/shared';
import { createAccountSchema } from '@totallator/shared';
import { createBillSchema } from '@totallator/shared';
import { createBudgetSchema } from '@totallator/shared';
import { createCategorySchema } from '@totallator/shared';
import { createLabelSchema } from '@totallator/shared';
import { createTagSchema } from '@totallator/shared';
import type { ImportStatusType } from '@totallator/shared';

import { filterNullUndefinedAndDuplicates } from '@/helpers/filterNullUndefinedAndDuplicates';
import { processObjectReturnTransaction } from '@/helpers/importTransformation';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { importFileHandler } from '@/server/files/fileHandler';

import { importMappingActions } from '../../importMappingActions';
import { inArrayWrapped } from '../misc/inArrayWrapped';
import { updatedTime } from '../misc/updatedTime';
import { getImportDetail } from './getImportDetail';
import { importProcessItems } from './importProcessItems';

type ImportTableType = typeof importTable.$inferSelect;

const createAccountImportSchema = createAccountSchema.extend({
	id: z.string().optional()
});
const createCategoryImportSchema = createCategorySchema.extend({
	id: z.string().optional()
});
const createTagImportSchema = createTagSchema.extend({
	id: z.string().optional()
});
const createLabelImportSchema = createLabelSchema.extend({
	id: z.string().optional()
});

const updateJournalImportSchema = updateJournalSchema.extend({
	id: z.string()
});

export const processCreatedImport = async ({ id }: { id: string }): Promise<void> => {
	const db = getContextDB();
	const data = await dbExecuteLogger(
		db.select().from(importTable).where(eq(importTable.id, id)),
		'getImportData'
	);
	if (data.length === 0) {
		throw new Error('Import Not Found');
	}
	const importData: ImportTableType = data[0];
	const importMappingInformation = importData.importMappingId
		? await importMappingActions.getById({ id: importData.importMappingId })
		: undefined;
	if (importData.status !== 'created') return;
	if (!importData.filename) {
		throw new Error('Import File Not Found');
	}

	const file = await importFileHandler().readToString(importData.filename);
	const checkImportDuplicates =
		(innerFunc: (data: string[]) => Promise<string[]>) => async (data: string[]) => {
			if (!importData.checkImportedOnly) {
				const existingImports = await dbExecuteLogger(
					db.select().from(importItemDetail).where(inArrayWrapped(importItemDetail.uniqueId, data)),
					'checkImportDuplicates'
				);
				if (existingImports.length > 0) {
					return filterNullUndefinedAndDuplicates(existingImports.map((item) => item.uniqueId));
				}
			}
			return await innerFunc(data);
		};
	const splitPrefixedIdentifiers = (data: string[]) => {
		const idValues: string[] = [];
		const titleValues: string[] = [];
		for (const currentItem of data) {
			if (currentItem.startsWith('id:')) {
				idValues.push(currentItem.slice(3));
			} else {
				titleValues.push(currentItem);
			}
		}

		return { idValues, titleValues };
	};
	if (importData.source === 'csv') {
		const rowsToSkip = importMappingInformation?.configuration
			? importMappingInformation.configuration.rowsToSkip
			: 0;
		const processedData = Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			beforeFirstChunk: function (chunk) {
				// Split the chunk into lines
				let lines = chunk.split(/\r\n|\r|\n/);
				// Skip the specified number of lines
				lines.splice(0, rowsToSkip);
				// Rejoin the remaining lines and return the modified chunk
				return lines.join('\n');
			}
		});
		if (processedData.errors && processedData.errors.length > 0) {
			await dbExecuteLogger(
				db
					.update(importTable)
					.set({
						status: 'error',
						errorInfo: processedData.errors,
						...updatedTime()
					})
					.where(eq(importTable.id, id)),
				'processCreatedImport - set error status'
			);
		} else {
			if (importData.type === 'transaction') {
				await importProcessItems({
					id,
					data: processedData,
					schema: createSimpleTransactionSchema
				});
			} else if (importData.type === 'journalUpdate') {
				await importProcessItems({
					id,
					data: processedData,
					schema: updateJournalImportSchema,
					getUniqueIdentifier: (data) => `id:${data.id}`,
					checkUniqueIdentifiers: checkImportDuplicates(async () => [])
				});
			} else if (importData.type === 'account') {
				await importProcessItems({
					id,
					data: processedData,
					schema: createAccountImportSchema,
					getUniqueIdentifier: (data) =>
						data.id
							? `id:${data.id}`
							: `${data.accountGroupCombined ? data.accountGroupCombined + ':' : ''}:${data.title}`,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const { idValues, titleValues } = splitPrefixedIdentifiers(data);
						const existingAccounts = await dbExecuteLogger(
							db
								.select()
								.from(account)
								.where(
									or(
										inArrayWrapped(account.accountTitleCombined, titleValues),
										inArrayWrapped(account.id, idValues)
									)
								),
							'checkImportDuplicates - account'
						);
						return existingAccounts.map((item) =>
							idValues.includes(item.id) ? `id:${item.id}` : item.accountTitleCombined
						);
					})
				});
			} else if (importData.type === 'bill') {
				await importProcessItems({
					id,
					data: processedData,
					schema: createBillSchema,
					getUniqueIdentifier: (data) => data.title,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingBills = await dbExecuteLogger(
							db.select().from(bill).where(inArrayWrapped(bill.title, data)),
							'checkImportDuplicates - bill'
						);
						return existingBills.map((item) => item.title);
					})
				});
			} else if (importData.type === 'budget') {
				await importProcessItems({
					id,
					data: processedData,
					schema: createBudgetSchema,
					getUniqueIdentifier: (data) => data.title,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingBudgets = await dbExecuteLogger(
							db.select().from(budget).where(inArrayWrapped(budget.title, data)),
							'checkImportDuplicates - budget'
						);
						return existingBudgets.map((item) => item.title);
					})
				});
			} else if (importData.type === 'category') {
				await importProcessItems({
					id,
					data: processedData,
					schema: createCategoryImportSchema,
					getUniqueIdentifier: (data) => (data.id ? `id:${data.id}` : data.title),
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const { idValues, titleValues } = splitPrefixedIdentifiers(data);
						const existingCategories = await dbExecuteLogger(
							db
								.select()
								.from(category)
								.where(
									or(
										inArrayWrapped(category.title, titleValues),
										inArrayWrapped(category.id, idValues)
									)
								),
							'checkImportDuplicates - category'
						);
						return existingCategories.map((item) =>
							idValues.includes(item.id) ? `id:${item.id}` : item.title
						);
					})
				});
			} else if (importData.type === 'tag') {
				await importProcessItems({
					id,
					data: processedData,
					schema: createTagImportSchema,
					getUniqueIdentifier: (data) => (data.id ? `id:${data.id}` : data.title),
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const { idValues, titleValues } = splitPrefixedIdentifiers(data);
						const existingTags = await dbExecuteLogger(
							db
								.select()
								.from(tag)
								.where(
									or(inArrayWrapped(tag.title, titleValues), inArrayWrapped(tag.id, idValues))
								),
							'checkImportDuplicates - tag'
						);
						return existingTags.map((item) =>
							idValues.includes(item.id) ? `id:${item.id}` : item.title
						);
					})
				});
			} else if (importData.type === 'label') {
				await importProcessItems({
					id,
					data: processedData,
					schema: createLabelImportSchema,
					getUniqueIdentifier: (data) => (data.id ? `id:${data.id}` : data.title),
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const { idValues, titleValues } = splitPrefixedIdentifiers(data);
						const existingLabels = await dbExecuteLogger(
							db
								.select()
								.from(label)
								.where(
									or(inArrayWrapped(label.title, titleValues), inArrayWrapped(label.id, idValues))
								),
							'checkImportDuplicates - label'
						);
						return existingLabels.map((item) =>
							idValues.includes(item.id) ? `id:${item.id}` : item.title
						);
					})
				});
			} else if (importData.type === 'mappedImport') {
				if (importData.importMappingId) {
					const importMappingDetail = await importMappingActions.getById({
						id: importData.importMappingId
					});
					if (importMappingDetail) {
						if (importMappingDetail.configuration) {
							const config = importMappingDetail.configuration;
							await importProcessItems({
								id,
								data: processedData,
								schema: createSimpleTransactionSchema,
								importDataToSchema: (data) => {
									const currentRow = data as Record<string, unknown>;
									const currentProcessedRow = processObjectReturnTransaction(currentRow, config);
									if (currentProcessedRow.errors) {
										return {
											errors: currentProcessedRow.errors.map((item) => item.error)
										};
									} else {
										const validatedData = createSimpleTransactionSchema.safeParse(
											currentProcessedRow.transaction
										);
										if (!validatedData.success) {
											return { errors: [validatedData.error.message] };
										} else {
											return { data: validatedData.data };
										}
									}
								},
								getUniqueIdentifier: (data) => data.uniqueId,
								checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
									const existingTransactions = await dbExecuteLogger(
										db
											.select()
											.from(journalEntry)
											.where(inArrayWrapped(journalEntry.uniqueId, data)),
										'checkImportDuplicates - simpleTransaction'
									);
									return filterNullUndefinedAndDuplicates(
										existingTransactions.map((item) => item.uniqueId)
									);
								})
							});
						}
					}
				}
			}
		}
	} else if (
		importData.type === 'mappedImport' &&
		importData.source === 'json' &&
		importData.importMappingId
	) {
		const importMappingDetail = await importMappingActions.getById({
			id: importData.importMappingId
		});
		const config = importMappingDetail?.configuration;
		if (!importMappingDetail || !config) {
			await dbExecuteLogger(
				db
					.update(importTable)
					.set({
						status: 'error',
						errorInfo: 'Import Mapping Not Found',
						...updatedTime()
					})
					.where(eq(importTable.id, id)),
				'processCreatedImport - set error status'
			);
			return;
		}
		const jsonData = JSON.parse(file);
		const schema = z.array(z.record(z.string(), z.any()));
		const parsedData = schema.safeParse(jsonData);
		if (!parsedData.success) {
			await dbExecuteLogger(
				db
					.update(importTable)
					.set({
						status: 'error',
						errorInfo: parsedData.error.flatten().formErrors,
						...updatedTime()
					})
					.where(eq(importTable.id, id)),
				'processCreatedImport - set error status'
			);
			return;
		}
		const processedData = parsedData.data;
		await importProcessItems({
			id,
			data: { data: processedData },
			schema: createSimpleTransactionSchema,
			importDataToSchema: (data) => {
				const currentRow = data as Record<string, unknown>;
				const currentProcessedRow = processObjectReturnTransaction(currentRow, config);
				if (currentProcessedRow.errors) {
					return {
						errors: currentProcessedRow.errors.map((item) => item.error)
					};
				} else {
					const validatedData = createSimpleTransactionSchema.safeParse(
						currentProcessedRow.transaction
					);
					if (!validatedData.success) {
						return { errors: [validatedData.error.message] };
					} else {
						return { data: validatedData.data };
					}
				}
			},
			getUniqueIdentifier: (data) => data.uniqueId,
			checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
				const existingTransactions = await dbExecuteLogger(
					db.select().from(journalEntry).where(inArrayWrapped(journalEntry.uniqueId, data)),
					'checkImportDuplicates - simpleTransaction'
				);
				return filterNullUndefinedAndDuplicates(existingTransactions.map((item) => item.uniqueId));
			})
		});
	}
	const importFinalDetail = await getImportDetail({ db, id });
	const onlyDuplicatesExist =
		importFinalDetail.linkedItemStatus.duplicate > 0 &&
		importFinalDetail.linkedItemStatus.processed === 0;
	const onlyErrorsExist =
		importFinalDetail.linkedItemStatus.error > 0 &&
		importFinalDetail.linkedItemStatus.processed === 0;
	const noItemsExist = importFinalDetail.linkedItemStatus.all === 0;
	const targetStatus: ImportStatusType = noItemsExist
		? 'complete'
		: onlyErrorsExist
			? 'error'
			: onlyDuplicatesExist
				? 'complete'
				: 'processed';
	await dbExecuteLogger(
		db
			.update(importTable)
			.set({ status: targetStatus, ...updatedTime() })
			.where(eq(importTable.id, id)),
		'processCreatedImport - set status'
	);
};
