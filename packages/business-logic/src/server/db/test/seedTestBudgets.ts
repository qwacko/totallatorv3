import type { DBType } from '@totallator/database';
import { budget } from '@totallator/database';

import { budgetCreateInsertionData } from '../../../actions/helpers/budget/budgetCreateInsertionData';

import { testImportSeedIds } from './seedTestImports';

export const seedTestBudgets = async (db: DBType) =>
	db.insert(budget).values([
		budgetCreateInsertionData(
			{
				title: 'Spending',
				status: 'active'
			},
			'Budget1'
		),
		budgetCreateInsertionData(
			{
				title: 'Travel',
				status: 'active'
			},
			'Budget2'
		),
		budgetCreateInsertionData(
			{
				title: 'Vehicle',
				status: 'active'
			},
			'Budget3'
		),
		budgetCreateInsertionData(
			{
				title: 'Fun',
				status: 'active'
			},
			'Budget4'
		),
		budgetCreateInsertionData(
			{
				title: 'Schooling (Disabled)',
				status: 'disabled'
			},
			'Budget5'
		),
		budgetCreateInsertionData(
			{
				title: 'Saving (Disbled)',
				status: 'disabled'
			},
			'Budget6'
		),
		budgetCreateInsertionData(
			{
				title: 'Emergency Fund',
				status: 'active',
				importId: testImportSeedIds.budget.importId,
				importDetailId: testImportSeedIds.budget.importDetailId
			},
			'Budget7'
		)
	]);
