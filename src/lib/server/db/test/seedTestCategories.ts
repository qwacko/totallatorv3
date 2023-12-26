import type { DBType } from '../db';
import { category } from '../postgres/schema';
import { categoryCreateInsertionData } from '../actions/helpers/category/categoryCreateInsertionData';

export const seedTestCategories = async (db: DBType) =>
	db.insert(category).values([
		categoryCreateInsertionData(
			{
				title: 'Bank:Fee',
				status: 'active'
			},
			'Category1'
		),
		categoryCreateInsertionData(
			{
				title: 'Bank:Interest',
				status: 'active'
			},
			'Category2'
		),
		categoryCreateInsertionData(
			{
				title: 'Food:Groceries',
				status: 'active'
			},
			'Category3'
		),
		categoryCreateInsertionData(
			{
				title: 'Food:Restaurants',
				status: 'active'
			},
			'Category4'
		),
		categoryCreateInsertionData(
			{
				title: 'Disabled:Item 1',
				status: 'disabled'
			},
			'Category5'
		),
		categoryCreateInsertionData(
			{
				title: 'Disabled:Item 2',
				status: 'disabled'
			},
			'Category6'
		)
	]);
