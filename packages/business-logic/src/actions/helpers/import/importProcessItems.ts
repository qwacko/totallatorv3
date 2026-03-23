import { nanoid } from 'nanoid';
import type Papa from 'papaparse';
import type { z } from 'zod';
import type { ZodTypeAny } from 'zod';

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

import { dbExecuteLogger } from '../../../server/db/dbLogger';

import { updatedTime } from '../misc/updatedTime';

const toRecord = (value: unknown): Record<string, unknown> => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}

	return { value };
};

const flattenFieldErrors = (fieldErrors: Record<string, string[] | undefined>): string[] => {
	return Object.entries(fieldErrors).flatMap(([field, errors]) =>
		(errors || []).map((error) => `${field}: ${error}`)
	);
};

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
						processedInfo: { source: toRecord(row) },
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
							dataToUse: toRecord(validatedData.data),
							source: toRecord(row),
							processed: toRecord(preprocessedData)
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
							dataToUse: toRecord(validatedData.data),
							source: toRecord(row),
							processed: toRecord(preprocessedData)
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
						processedInfo: { source: toRecord(row), processed: toRecord(preprocessedData) },
						errorInfo: {
							errors: [
								...validatedData.error.flatten().formErrors,
								...flattenFieldErrors(validatedData.error.flatten().fieldErrors)
							]
						},
						importId: id
					}),
				'Import - Process Items - Error 2'
			);
		}
	}
};
