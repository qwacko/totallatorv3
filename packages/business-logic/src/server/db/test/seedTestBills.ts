import type { DBType } from '@totallator/database';
import { bill } from '@totallator/database';

import { billCreateInsertionData } from '../../../actions/helpers/bill/billCreateInsertionData';

import { testImportSeedIds } from './seedTestImports';

export const seedTestBills = async (db: DBType) =>
	db.insert(bill).values([
		billCreateInsertionData(
			{
				title: 'Power',
				status: 'active'
			},
			'Bill1'
		),
		billCreateInsertionData(
			{
				title: 'Rent',
				status: 'active'
			},
			'Bill2'
		),
		billCreateInsertionData(
			{
				title: 'Insurance',
				status: 'active'
			},
			'Bill3'
		),
		billCreateInsertionData(
			{
				title: 'Internet',
				status: 'active'
			},
			'Bill4'
		),
		billCreateInsertionData(
			{
				title: 'Schooling (Disabled)',
				status: 'disabled'
			},
			'Bill5'
		),
		billCreateInsertionData(
			{
				title: 'Car Payment (Complete)',
				status: 'disabled'
			},
			'Bill6'
		),
		billCreateInsertionData(
			{
				title: 'Mobile Plan',
				status: 'active',
				importId: testImportSeedIds.bill.importId,
				importDetailId: testImportSeedIds.bill.importDetailId
			},
			'Bill7'
		)
	]);
