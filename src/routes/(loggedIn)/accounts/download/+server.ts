import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import type { CreateAccountSchemaType } from '$lib/schema/accountSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';

import Papa from 'papaparse';

export const GET = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);

	const journalData = await tActions.account.list({
		db,
		filter: { ...searchParams, page: 0, pageSize: 100000 }
	});

	const preppedData = journalData.data.map((item, row) => {
		if (searchParams?.downloadType === 'import') {
			return {
				title: item.title,
				accountGroupCombined: item.accountGroupCombined,
				type: item.type,
				startDate: item.startDate || undefined,
				endDate: item.endDate || undefined,
				isCash: item.isCash,
				isNetWorth: item.isNetWorth,
				status: item.status
			} satisfies CreateAccountSchemaType;
		}
		return {
			row,
			id: item.id,
			status: item.status,
			type: item.type,
			title: item.title,
			accountGroup: item.accountGroup,
			accountGroup2: item.accountGroup2,
			accountGroup3: item.accountGroup3,
			accountGroupCombined: item.accountGroupCombined,
			accountTitleCombined: item.accountTitleCombined,
			isCash: item.isCash,
			isNetWorth: item.isNetWorth,
			startDate: item.startDate,
			endDate: item.endDate,
			sum: item.sum,
			count: item.count
		};
	});

	const csvData = Papa.unparse(preppedData);

	const dateText = new Date().toISOString().slice(0, 19);

	return new Response(csvData, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachement; filename=${dateText}-accountExport.csv`
		}
	});
};
