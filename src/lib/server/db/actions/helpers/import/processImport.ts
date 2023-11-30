import { eq, inArray, type InferSelectModel } from 'drizzle-orm';
import type { DBType } from '../../../db';
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
} from '../../../schema/transactionSchema';
import Papa from 'papaparse';
import { readFileSync } from 'fs';
import { updatedTime } from '../misc/updatedTime';
import { importActions } from '../../importActions';
import {
	createSimpleTransactionSchema,
	type CreateSimpleTransactionType
} from '$lib/schema/journalSchema';
import { createAccountSchema } from '$lib/schema/accountSchema';
import { processObjectReturnTransaction } from '$lib/helpers/importTransformation';
import { createBillSchema } from '$lib/schema/billSchema';
import { createBudgetSchema } from '$lib/schema/budgetSchema';
import { createCategorySchema } from '$lib/schema/categorySchema';
import { createLabelSchema } from '$lib/schema/labelSchema';
import { createTagSchema } from '$lib/schema/tagSchema';
import type { ZodSchema } from 'zod';
import { filterNullUndefinedAndDuplicates } from '../../../../../../routes/(loggedIn)/journals/filterNullUndefinedAndDuplicates';
import { tActions } from '../../tActions';
import { getImportDetail } from './getImportDetail';
import type { ImportStatusType } from '$lib/schema/importSchema';

export const processCreatedImport = async ({
	db,
	id,
	importData
}: {
	db: DBType;
	id: string;
	importData: InferSelectModel<typeof importTable>;
}) => {
	if (importData.status !== 'created') return;
	if (importData.source === 'csv') {
		if (!importData.filename) {
			throw new Error('Import File Not Found');
		}
		const file = readFileSync(importData.filename);
		const processedData = Papa.parse(file.toString(), {
			header: true,
			skipEmptyLines: true
		});

		const checkImportDuplicates =
			(innerFunc: (data: string[]) => Promise<string[]>) => async (data: string[]) => {
				if (!importData.checkImportedOnly) {
					const existingImports = await db
						.select()
						.from(importItemDetail)
						.where(inArray(importItemDetail.uniqueId, data))
						.execute();

					if (existingImports.length > 0) {
						return filterNullUndefinedAndDuplicates(existingImports.map((item) => item.uniqueId));
					}
				}

				return await innerFunc(data);
			};

		if (processedData.errors && processedData.errors.length > 0) {
			await db
				.update(importTable)
				.set({
					status: 'error',
					errorInfo: processedData.errors,
					...updatedTime()
				})
				.where(eq(importTable.id, id))
				.execute();
		} else {
			if (importData.type === 'transaction') {
				await importActions.processItems({
					db,
					id,
					data: processedData,
					schema: createSimpleTransactionSchema
				});
			} else if (importData.type === 'account') {
				await importActions.processItems({
					db,
					id,
					data: processedData,
					schema: createAccountSchema,
					getUniqueIdentifier: (data) =>
						`${data.accountGroupCombined ? data.accountGroupCombined + ':' : ''}:${data.title}`,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingAccounts = await db
							.select()
							.from(account)
							.where(inArray(account.accountTitleCombined, data))
							.execute();
						return existingAccounts.map((item) => item.accountTitleCombined);
					})
				});
			} else if (importData.type === 'bill') {
				await importActions.processItems({
					db,
					id,
					data: processedData,
					schema: createBillSchema,
					getUniqueIdentifier: (data) => data.title,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingBills = await db
							.select()
							.from(bill)
							.where(inArray(bill.title, data))
							.execute();
						return existingBills.map((item) => item.title);
					})
				});
			} else if (importData.type === 'budget') {
				await importActions.processItems({
					db,
					id,
					data: processedData,
					schema: createBudgetSchema,
					getUniqueIdentifier: (data) => data.title,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingBudgets = await db
							.select()
							.from(budget)
							.where(inArray(budget.title, data))
							.execute();
						return existingBudgets.map((item) => item.title);
					})
				});
			} else if (importData.type === 'category') {
				await importActions.processItems({
					db,
					id,
					data: processedData,
					schema: createCategorySchema,
					getUniqueIdentifier: (data) => data.title,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingCategories = await db
							.select()
							.from(category)
							.where(inArray(category.title, data))
							.execute();
						return existingCategories.map((item) => item.title);
					})
				});
			} else if (importData.type === 'tag') {
				await importActions.processItems({
					db,
					id,
					data: processedData,
					schema: createTagSchema,
					getUniqueIdentifier: (data) => data.title,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingTags = await db
							.select()
							.from(tag)
							.where(inArray(tag.title, data))
							.execute();
						return existingTags.map((item) => item.title);
					})
				});
			} else if (importData.type === 'label') {
				await importActions.processItems({
					db,
					id,
					data: processedData,
					schema: createLabelSchema,
					getUniqueIdentifier: (data) => data.title,
					checkUniqueIdentifiers: checkImportDuplicates(async (data) => {
						const existingLabels = await db
							.select()
							.from(label)
							.where(inArray(label.title, data))
							.execute();
						return existingLabels.map((item) => item.title);
					})
				});
			} else if (importData.type === 'mappedImport') {
				if (importData.importMappingId) {
					const importMappingDetail = await tActions.importMapping.getById({
						db,
						id: importData.importMappingId
					});

					if (importMappingDetail) {
						if (importMappingDetail.configuration) {
							const config = importMappingDetail.configuration;

							await importActions.processItems<CreateSimpleTransactionType>({
								db,
								id,
								data: processedData,
								schema: createSimpleTransactionSchema as ZodSchema<CreateSimpleTransactionType>,
								importDataToSchema: (data) => {
									const currentRow = data as Record<string, unknown>;
									const currentProcessedRow = processObjectReturnTransaction(currentRow, config);
									if (currentProcessedRow.errors) {
										return { errors: currentProcessedRow.errors.map((item) => item.error) };
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
									const existingTransactions = await db
										.select()
										.from(journalEntry)
										.where(inArray(journalEntry.uniqueId, data))
										.execute();
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

	await db
		.update(importTable)
		.set({ status: targetStatus, ...updatedTime() })
		.where(eq(importTable.id, id))
		.execute();
};
