import type { CreateAccountSchemaType } from '$lib/schema/accountSchema';
import { getRandomArrayElement, getRandomBoolean, getRandomInteger } from './getRandom';

const assetTitleParts = ['Bank', 'Home', 'Cash', 'Savings', 'Investment', 'Art', 'Retirement'];
const assetTitleParts2 = ['Value', 'Account', 'Shares', 'Holdings', 'Card'];

const accountGroupPart1Options = ['Bank', 'Personal', 'Business', undefined];
const accountGroupPart2Options = ['Safe', 'Account', 'Property', undefined, undefined];
const accountGroupPart3Options = ['Box', 'Property', undefined, undefined, undefined];

const createAccountGroupCombined = () =>
	[
		getRandomArrayElement(accountGroupPart1Options),
		getRandomArrayElement(accountGroupPart2Options),
		getRandomArrayElement(accountGroupPart3Options)
	]
		.filter((item) => item !== undefined)
		.join(':');

const liabilityTitleParts2 = ['Credit Card', 'Mortgage', 'Loan', 'Lending', 'Owing', 'Debt'];
const expenseLocations = [
	'Los Angeles',
	'New York',
	'London',
	'Sydney',
	'Dubai',
	'Amsterdam',
	'Chicago',
	'San Francisco',
	'Tokyo',
	'Singapore',
	'Durban'
];
const expenseTypes = [
	'Fuel',
	'Gas',
	'Power',
	'Internet',
	'Mobile',
	'Supermarket',
	'Grocery Store',
	'Interest',
	'Rent'
];

const incomeGroupOptions = ['Personal', 'Partner', 'Business', 'Investment', 'Government'];
const incomeOptions = ['Wages', 'Salary', 'Interest', 'Rent', 'Capital Gains', 'Deposit'];

export const createAsset = (): CreateAccountSchemaType => {
	return {
		type: 'asset',
		title: `${getRandomArrayElement(assetTitleParts)} ${getRandomArrayElement(
			assetTitleParts2
		)} ${getRandomInteger(10)}`,
		accountGroupCombined: createAccountGroupCombined(),
		isCash: getRandomBoolean(0.4),
		isNetWorth: getRandomBoolean(0.95),
		status: 'active'
	};
};

export const createLiability = (): CreateAccountSchemaType => {
	return {
		type: 'liability',
		title: `${getRandomArrayElement(assetTitleParts)} ${getRandomArrayElement(
			liabilityTitleParts2
		)} ${getRandomInteger(10)}`,
		accountGroupCombined: createAccountGroupCombined(),
		isCash: getRandomBoolean(0.4),
		isNetWorth: getRandomBoolean(0.95),
		status: 'active'
	};
};

export const createIncome = (): CreateAccountSchemaType => {
	return {
		type: 'income',
		title: `${getRandomArrayElement(incomeGroupOptions)} ${getRandomArrayElement(
			incomeOptions
		)} ${getRandomInteger(10)}`,
		accountGroupCombined: '',
		isCash: false,
		isNetWorth: false,
		status: 'active'
	};
};

export const createExpense = (): CreateAccountSchemaType => {
	return {
		type: 'expense',
		title: `${getRandomArrayElement(expenseLocations)} ${getRandomArrayElement(
			expenseTypes
		)} ${getRandomInteger(50)}`,
		accountGroupCombined: '',
		isCash: false,
		isNetWorth: false,
		status: 'active'
	};
};
