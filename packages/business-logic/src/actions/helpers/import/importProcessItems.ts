import { nanoid } from 'nanoid';
import type Papa from 'papaparse';
import type { z } from 'zod';
import { ZodTypeAny } from 'zod';

import { getContextDB } from '@totallator/context';
import { importItemDetail } from '@totallator/database';
import type {
	createAccountSchema,
	createBillSchema,
	createBudgetSchema,
	createCategorySchema,
	createLabelSchema,
	createSimpleTransactionSchema,
	createTagSchema
} from '@totallator/shared';

import { dbExecuteLogger } from '@/server/db/dbLogger';

import { updatedTime } from '../misc/updatedTime';

type ProcessItemsType =
	| typeof createSimpleTransactionSchema
	| typeof createAccountSchema
	| typeof createBillSchema
	| typeof createBudgetSchema
	| typeof createCategorySchema
	| typeof createTagSchema
	| typeof createLabelSchema
	| ZodTypeAny;

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
	const seenUniqueIdentifiers = new Set<string>();

	for (const currentRow of data.data) {
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
			continue;
		}
		const validatedData = schema.safeParse(preprocessedData.data);
		if (validatedData.success) {
			const uniqueIdentifier = getUniqueIdentifier
				? getUniqueIdentifier(validatedData.data as z.infer<S>)
				: undefined;
			let foundUniqueIdentifiers: string[] | undefined;
			if (uniqueIdentifier) {
				if (seenUniqueIdentifiers.has(uniqueIdentifier)) {
					foundUniqueIdentifiers = [uniqueIdentifier];
				} else if (checkUniqueIdentifiers) {
					foundUniqueIdentifiers = await checkUniqueIdentifiers([uniqueIdentifier]);
				}
			}

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
						uniqueId: uniqueIdentifier
					}),
					'Import - Process Items - Duplicate'
				);
			} else {
				if (uniqueIdentifier) {
					seenUniqueIdentifiers.add(uniqueIdentifier);
				}
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
						uniqueId: uniqueIdentifier
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
					errorInfo: {
						errors: validatedData.error.flatten().formErrors,
						fieldErrors: validatedData.error.flatten().fieldErrors
					},
					importId: id
				}),
				'Import - Process Items - Error 2'
			);
		}
	}
};
