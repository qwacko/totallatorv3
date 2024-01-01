import type { DBType } from '../db';
import { budget } from '../postgres/schema';
import { budgetCreateInsertionData } from '../actions/helpers/budget/budgetCreateInsertionData';

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
		)
	]);
