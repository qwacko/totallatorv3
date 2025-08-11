import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getContextDB } from '@totallator/context';
import { importItemDetail } from '@totallator/database';
import { nanoid } from 'nanoid';
import { ZodSchema } from 'zod';
import { updatedTime } from '../misc/updatedTime';

export const importProcessItems = async <S extends Record<string, unknown>>({
	id,
	data,
	schema,
	importDataToSchema = (data) => ({ data: data as S }),
	getUniqueIdentifier,
	checkUniqueIdentifiers
}: {
	id: string;
	data: Papa.ParseResult<unknown> | { data: Record<string, any>[] };
	schema: ZodSchema<S>;
	importDataToSchema?: (data: unknown) => { data: S } | { errors: string[] };
	getUniqueIdentifier?: ((data: S) => string | null | undefined) | undefined;
	checkUniqueIdentifiers?: (data: string[]) => Promise<string[]>;
}): Promise<void> => {
	const db = getContextDB();
	await Promise.all(
		data.data.map(async (currentRow) => {
			const row = currentRow as Record<string, unknown>;
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
					? getUniqueIdentifier(validatedData.data)
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
