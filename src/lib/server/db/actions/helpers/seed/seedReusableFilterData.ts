import type { CreateReusableFilterSchemaType } from '$lib/schema/reusableFilterSchema';
import type { DBType } from '$lib/server/db/db';
import { getRandomBoolean } from '../misc/getRandom';

export const seedReusableFilterData = ({ db, id }: { db: DBType; id: number }) => {
	const filterData: CreateReusableFilterSchemaType = {
		applyAutomatically: false,
		title: `Test Filter ${id}`,
		filter: {
			account: {
				type: getRandomBoolean(0.25) ? ['asset', 'liability'] : undefined,
				isCash: getRandomBoolean(0.5) ? undefined : getRandomBoolean(0.5)
			},
			minAmount: getRandomBoolean(0.5) ? undefined : 0,
			tag: getRandomBoolean(0.5) ? undefined : { title: '23' },
			orderBy: [],
			page: 1,
			pageSize: 100
		},
		applyFollowingImport: false,
		group: 'journal',
		listed: true
	};
	return filterData;
};
