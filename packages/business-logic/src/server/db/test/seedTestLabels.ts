import type { DBType } from '@totallator/database';
import { label } from '@totallator/database';

import { labelCreateInsertionData } from '@/actions/helpers/label/labelCreateInsertionData';

export const seedTestLabels = async (db: DBType) =>
	db.insert(label).values([
		labelCreateInsertionData(
			{
				title: 'Label 1',
				status: 'active'
			},
			'Label1'
		),
		labelCreateInsertionData(
			{
				title: 'Label 2',
				status: 'active'
			},
			'Label2'
		),
		labelCreateInsertionData(
			{
				title: 'Label 3',
				status: 'active'
			},
			'Label3'
		),
		labelCreateInsertionData(
			{
				title: 'Label 4',
				status: 'active'
			},
			'Label4'
		),
		labelCreateInsertionData(
			{
				title: 'Label 5 (Disabled)',
				status: 'disabled'
			},
			'Label5'
		),
		labelCreateInsertionData(
			{
				title: 'Label 6 (Complete)',
				status: 'disabled'
			},
			'Label6'
		)
	]);
