import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import type { CreateCategorySchemaType } from '$lib/schema/categorySchema';
import { tActions } from '$lib/server/db/actions/tActions.js';

import Papa from 'papaparse';

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);

	const journalData = await tActions.category.list({
		db: data.locals.db,
		filter: { ...searchParams, page: 0, pageSize: 100000 }
	});

	const preppedData = journalData.data.map((item, row) => {
		if (searchParams?.downloadType === 'import') {
			return {
				title: item.title,
				status: item.status
			} satisfies CreateCategorySchemaType;
		}
		return {
			row,
			id: item.id,
			title: item.title,
			group: item.group,
			single: item.single,
			status: item.status,
			sum: item.sum,
			count: item.count
		};
	});

	const csvData = Papa.unparse(preppedData);

	const dateText = new Date().toISOString().slice(0, 19);

	return new Response(csvData, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachement; filename=${dateText}-categoryExport.csv`
		}
	});
};
