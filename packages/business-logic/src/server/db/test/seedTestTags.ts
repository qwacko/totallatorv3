import type { DBType } from '@totallator/database';
import { tag } from '@totallator/database';

import { tagCreateInsertionData } from '@/actions/helpers/tag/tagCreateInsertionData';

export const seedTestTags = async (db: DBType) =>
	db.insert(tag).values([
		tagCreateInsertionData(
			{
				title: 'Personal:Home',
				status: 'active'
			},
			'Tag1'
		),
		tagCreateInsertionData(
			{
				title: 'Personal:Personal',
				status: 'active'
			},
			'Tag2'
		),
		tagCreateInsertionData(
			{
				title: 'Business A:Location A',
				status: 'active'
			},
			'Tag3'
		),
		tagCreateInsertionData(
			{
				title: 'Business A:Location B',
				status: 'active'
			},
			'Tag4'
		),
		tagCreateInsertionData(
			{
				title: 'Disabled:Item 1',
				status: 'disabled'
			},
			'Tag5'
		),
		tagCreateInsertionData(
			{
				title: 'Disabled:Item 2',
				status: 'disabled'
			},
			'Tag6'
		)
	]);
