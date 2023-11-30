import type { BillFilterSchemaType } from '$lib/schema/billSchema';
import type { DBType } from '../../../db';
import { bill } from '../../../schema';
import { SQL, eq, inArray, like } from 'drizzle-orm';
import { arrayToText } from '../misc/arrayToText';
import { importIdsToTitles } from '../import/importIdsToTitles';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';

export const billFilterToQuery = (
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id && restFilter.id !== '') where.push(eq(bill.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(bill.id, restFilter.idArray));
	if (restFilter.title && restFilter.title !== '')
		where.push(like(bill.title, `%${restFilter.title}%`));
	if (restFilter.status) where.push(eq(bill.status, restFilter.status));
	if (restFilter.disabled !== undefined) where.push(eq(bill.disabled, restFilter.disabled));
	if (restFilter.allowUpdate !== undefined)
		where.push(eq(bill.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active !== undefined) where.push(eq(bill.active, restFilter.active));
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArray(bill.importId, restFilter.importIdArray));

	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArray(bill.importDetailId, restFilter.importDetailIdArray));

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
	}

	return where;
};

export const billIdToTitle = async (db: DBType, id: string) => {
	const foundBill = await db
		.select({ title: bill.title })
		.from(bill)
		.where(eq(bill.id, id))
		.limit(1)
		.execute();

	if (foundBill?.length === 1) {
		return foundBill[0].title;
	}
	return id;
};

const billIdsToTitle = async (db: DBType, ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => billIdToTitle(db, id)));

	return titles;
};

export const billFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await billIdToTitle(db, restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.idArray,
				inputToText: (titles) => billIdsToTitle(db, titles)
			})
		);
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	if (restFilter.disabled !== undefined)
		stringArray.push(`Is ${restFilter.disabled ? '' : 'Not '}Disabled`);
	if (restFilter.allowUpdate !== undefined)
		stringArray.push(`Can${restFilter.allowUpdate ? '' : "'t"} Be Updated`);
	if (restFilter.active) stringArray.push(`Is ${restFilter.active ? '' : 'Not '}Active`);
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importIdArray,
				singularName: 'Import',
				inputToText: importIdsToTitles
			})
		);

	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importDetailIdArray,
				singularName: 'Import Detail ID'
			})
		);

	summaryFilterToText({ stringArray, filter: restFilter });

	if (stringArray.length === 0 && allText) {
		stringArray.push('Showing All');
	}

	if (prefix) {
		return stringArray.map((item) => `${prefix} ${item}`);
	}

	return stringArray;
};
