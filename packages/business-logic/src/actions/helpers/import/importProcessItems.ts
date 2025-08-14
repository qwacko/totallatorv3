import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getContextDB } from '@totallator/context';
import { importItemDetail } from '@totallator/database';
import { nanoid } from 'nanoid';
import type { z } from 'zod';
import { updatedTime } from '../misc/updatedTime';
import type Papa from 'papaparse';
import type {
	createAccountSchema,
	createBillSchema,
	createBudgetSchema,
	createCategorySchema,
	createLabelSchema,
	createSimpleTransactionSchema,
	createTagSchema
} from '@totallator/shared';

type ProcessItemsType =
	| typeof createSimpleTransactionSchema
	| typeof createAccountSchema
	| typeof createBillSchema
	| typeof createBudgetSchema
	| typeof createCategorySchema
	| typeof createTagSchema
	| typeof createLabelSchema
	| typeof createSimpleTransactionSchema;

interface ImportProcessItemsParams<S extends ProcessItemsType> {
	id: string;
	data: Papa.ParseResult<unknown> | { data: any[] };
	schema: S;
	importDataToSchema?: (data: any) => { data: z.infer<S> } | { errors: string[] };
	getUniqueIdentifier?: (data: z.infer<S>) => string | null | undefined;
	checkUniqueIdentifiers?: (data: string[]) => Promise<string[]>;
}

export const importProcessItems = async <S extends ProcessItemsType>({
	id,
	data: dataExternal,
	schema,
	importDataToSchema = (data) => ({ data: data as z.infer<S> }),
	getUniqueIdentifier,
	checkUniqueIdentifiers
}: ImportProcessItemsParams<S>): Promise<void> => {
	const data = dataExternal as { data: any[] };
	const db = getContextDB();
	await Promise.all(
		data.data.map(async (currentRow: any) => {
			const row = currentRow;
			const importDetailId = nanoid();
			const preprocessedData = importDataToSchema(row);
			if ('errors' in preprocessedData) {
				await dbExecuteLogger(
					db.insert(importItemDetail).values({
						id: importDetailId,
						...updatedTime(),
						status: 'error',
						processedInfo: { source: row },
						errorInfo: { errors: preprocessedData.errors },
						importId: id
					}),
					'Import - Process Items - Error'
				);
				return;
			}
			const validatedData = schema.safeParse(preprocessedData.data);
			if (validatedData.success) {
				const unqiueIdentifier = getUniqueIdentifier
					? getUniqueIdentifier(validatedData.data as z.infer<S>)
					: undefined;
				const foundUniqueIdentifiers =
					checkUniqueIdentifiers && unqiueIdentifier
						? await checkUniqueIdentifiers([unqiueIdentifier])
						: undefined;

				if (foundUniqueIdentifiers && foundUniqueIdentifiers.length > 0) {
					await dbExecuteLogger(
						db.insert(importItemDetail).values({
							id: importDetailId,
							...updatedTime(),
							status: 'duplicate',
							processedInfo: {
								dataToUse: validatedData.data,
								source: row,
								processed: preprocessedData
							},
							importId: id,
							uniqueId: unqiueIdentifier
						}),
						'Import - Process Items - Duplicate'
					);
				} else {
					await dbExecuteLogger(
						db.insert(importItemDetail).values({
							id: importDetailId,
							...updatedTime(),
							status: 'processed',
							processedInfo: {
								dataToUse: validatedData.data,
								source: row,
								processed: preprocessedData
							},
							importId: id,
							uniqueId: unqiueIdentifier
						}),
						'Import - Process Items - Processed'
					);
				}
			} else {
				await dbExecuteLogger(
					db.insert(importItemDetail).values({
						id: importDetailId,
						...updatedTime(),
						status: 'error',
						processedInfo: { source: row, processed: preprocessedData },
						errorInfo: { errors: validatedData.error.flatten().formErrors },
						importId: id
					}),
					'Import - Process Items - Error 2'
				);
			}
		})
	);
};
