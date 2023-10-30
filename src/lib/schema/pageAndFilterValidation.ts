import { urlGenerator } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
import { z } from 'zod';

export const pageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(
			urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter() })
				.url
		),
	currentPage: z
		.string()
		.optional()
		.default(
			urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter() })
				.url
		)
});

export const accountPageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/accounts', searchParamsValue: {} }).url),
	currentPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/accounts', searchParamsValue: {} }).url)
});

export const billPageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/bills', searchParamsValue: {} }).url),
	currentPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/bills', searchParamsValue: {} }).url)
});

export const budgetPageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/budgets', searchParamsValue: {} }).url),
	currentPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/budgets', searchParamsValue: {} }).url)
});

export const categoryPageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/categories', searchParamsValue: {} }).url),
	currentPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/categories', searchParamsValue: {} }).url)
});

export const labelPageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/labels', searchParamsValue: {} }).url),
	currentPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/labels', searchParamsValue: {} }).url)
});

export const tagPageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/tags', searchParamsValue: {} }).url),
	currentPage: z
		.string()
		.optional()
		.default(urlGenerator({ address: '/(loggedIn)/tags', searchParamsValue: {} }).url)
});
