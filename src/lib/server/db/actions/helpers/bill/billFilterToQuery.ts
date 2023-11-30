import type { BillFilterSchemaType } from '$lib/schema/billSchema';
import { db } from '../../../db';
import { bill } from '../../../schema';
import { SQL, eq, inArray, like } from 'drizzle-orm';
import { arrayToText } from '../arrayToText';
import { importIdsToTitles } from '../importIdsToTitles';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';

export const billFilterToQuery = (
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(bill.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(bill.id, restFilter.idArray));
	if (restFilter.title) where.push(like(bill.title, `%${restFilter.title}%`));
	if (restFilter.status) where.push(eq(bill.status, restFilter.status));
	if (restFilter.disabled) where.push(eq(bill.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(bill.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(bill.active, restFilter.active));
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArray(bill.importId, restFilter.importIdArray));

	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArray(bill.importDetailId, restFilter.importDetailIdArray));

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
	}

	return where;
};

export const billIdToTitle = async (id: string) => {
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

const billIdsToTitle = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => billIdToTitle(id)));

	return titles;
};

export const billFilterToText = async (
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,

	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await billIdToTitle(restFilter.id)}`);
	if (restFilter.idArray) {
		if (restFilter.idArray.length === 1) {
			stringArray.push(`Is ${await billIdToTitle(restFilter.idArray[0])}`);
		} else {
			stringArray.push(`Is One Of ${(await billIdsToTitle(restFilter.idArray)).join(',')}`);
		}
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	if (restFilter.disabled) stringArray.push(`Is Disabled`);
	if (restFilter.allowUpdate) stringArray.push(`Can Be Updated`);
	if (restFilter.active) stringArray.push(`Is Active`);
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
