import { SQL, eq, ilike } from 'drizzle-orm';
import { idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { autoImportTable } from '@totallator/database';
import type { DBType } from '@totallator/database';
import { inArrayWrapped } from '../misc/inArrayWrapped';
import {
	type AutoImportFilterSchemaType,
	autoImportTypeToDisplay,
	autoImportFrequencyToDisplay
} from '@totallator/shared';
import { importMappingIdToTitle } from '../import/importMappingFilterToQuery';
import { dbExecuteLogger } from '@/server/db/dbLogger';

export const autoImportFilterToQuery = ({
	filter
}: {
	filter: Omit<AutoImportFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
}) => {
	const where: SQL<unknown>[] = [];

	if (filter.id) {
		where.push(eq(autoImportTable.id, filter.id));
	}
	if (filter.title) {
		where.push(ilike(autoImportTable.title, `%${filter.title}%`));
	}
	if (filter.importMappingId) {
		where.push(eq(autoImportTable.importMappingId, filter.importMappingId));
	}
	if (filter.frequency && filter.frequency.length > 0) {
		where.push(inArrayWrapped(autoImportTable.frequency, filter.frequency));
	}
	if (filter.type && filter.type.length > 0) {
		where.push(inArrayWrapped(autoImportTable.type, filter.type));
	}
	if (filter.autoProcess !== undefined) {
		where.push(eq(autoImportTable.autoProcess, filter.autoProcess));
	}

	if (filter.autoClean !== undefined) {
		where.push(eq(autoImportTable.autoClean, filter.autoClean));
	}
	if (filter.enabled !== undefined) {
		where.push(eq(autoImportTable.enabled, filter.enabled));
	}

	return where;
};

export const autoImportIdToTitle = async (db: DBType, id: string) => {
	const foundAutoImport = await dbExecuteLogger(
		db
			.select({ title: autoImportTable.title })
			.from(autoImportTable)
			.where(eq(autoImportTable.id, id))
			.limit(1),
		'autoImportIdToTitle'
	);

	if (foundAutoImport?.length === 1) {
		return foundAutoImport[0].title;
	}
	return id;
};

export const autoImportFilterToText = async ({
	db,
	filter
}: {
	db: DBType;
	filter: AutoImportFilterSchemaType;
}) => {
	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, autoImportIdToTitle);

	if (filter.type && filter.type.length > 0) {
		stringArray.push(
			`Type is ${filter.type.map((item) => autoImportTypeToDisplay(item)).join(', ')}`
		);
	}
	if (filter.frequency && filter.frequency.length > 0) {
		stringArray.push(
			`Frequency is ${filter.frequency.map((currentItem) => autoImportFrequencyToDisplay(currentItem)).join(', ')}`
		);
	}
	if (filter.importMappingId) {
		stringArray.push(`Import Mapping is ${importMappingIdToTitle(db, filter.importMappingId)}`);
	}

	if (filter.autoProcess !== undefined) {
		stringArray.push(`Auto Process is ${filter.autoProcess ? 'Enabled' : 'Disabled'}`);
	}

	if (filter.autoClean !== undefined) {
		stringArray.push(`Auto Clean is ${filter.autoClean ? 'Enabled' : 'Disabled'}`);
	}
	if (filter.enabled !== undefined) {
		stringArray.push(`${filter.enabled ? 'Enabled' : 'Disabled'}`);
	}

	if (stringArray.length === 0) {
		return ['Showing All Auto Imports'];
	}

	return stringArray;
};
