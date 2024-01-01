import { z } from 'zod';

const importDetailStatusEnum = [
	'error',
	'processed',
	'duplicate',
	'imported',
	'importError'
] as const;

const importStatusEnum = ['created', 'error', 'processed', 'imported', 'complete'] as const;

const importTypeEnum = [
	'transaction',
	'account',
	'bill',
	'budget',
	'category',
	'tag',
	'label',
	'mappedImport'
] as const;

const importSourceEnum = ['csv'] as const;

const accountTypeEnum = ['income', 'expense', 'asset', 'liability'] as const;

const reusableFilterModifcationType = ['replace', 'modify'] as const;
const statusEnum = ['active', 'disabled'] as const;

const currencyFormatEnum = ['USD', 'GBP', 'INR', 'AUD', 'EUR'] as const;

const dateFormatEnum = ['YYYY-MM-DD', 'MM/DD/YY', 'MM/DD/YYYY', 'DD/MM/YY', 'DD/MM/YYYY'] as const;

const idColumn = { id: z.string() };

const statusColumns = {
	status: z.enum(statusEnum),
	active: z.boolean(),
	disabled: z.boolean(),
	allowUpdate: z.boolean()
};

const importColumns = {
	importId: z.string().nullable(),
	importDetailId: z.string().nullable()
};

const timestampColumns = {
	createdAt: z.date(),
	updatedAt: z.date()
};

export const backupSchemaRev01 = z.object({
	version: z.literal(1),
	information: z.object({
		createdAt: z.date(),
		title: z.string(),
		creationReason: z.string(),
		createdBy: z.string(),
		itemCount: z.object({
			numberAccounts: z.number(),
			numberBills: z.number(),
			numberBudgets: z.number(),
			numberCategories: z.number(),
			numberTransactions: z.number(),
			numberJournalEntries: z.number(),
			numberLabels: z.number(),
			numberLabelsToJournals: z.number(),
			numberTags: z.number(),
			numberImportItemDetails: z.number(),
			numberImportTables: z.number(),
			numberImportMappings: z.number(),
			numberReusableFilters: z.number()
		})
	}),
	data: z.object({
		user: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				username: z.string(),
				admin: z.boolean(),
				currencyFormat: z.enum(currencyFormatEnum),
				dateFormat: z.enum(dateFormatEnum)
			})
		),
		session: z.array(
			z.object({
				id: z.string(),
				userId: z.string(),
				activeExpires: z.bigint(),
				idleExpires: z.bigint()
			})
		),
		key: z.array(
			z.object({
				id: z.string(),
				userId: z.string(),
				hashedPassword: z.string().nullable()
			})
		),
		account: z.array(
			z.object({
				...idColumn,
				...importColumns,
				title: z.string(),
				type: z.enum(accountTypeEnum),
				isCash: z.boolean(),
				isNetWorth: z.boolean(),
				accountGroup: z.string(),
				accountGroup2: z.string(),
				accountGroup3: z.string(),
				accountGroupCombined: z.string(),
				accountTitleCombined: z.string(),
				startDate: z.string().nullable(),
				endDate: z.string().nullable(),
				...timestampColumns
			})
		),
		tag: z.array(
			z.object({
				...idColumn,
				...importColumns,
				title: z.string(),
				group: z.string(),
				single: z.string(),
				...statusColumns,
				...timestampColumns
			})
		),
		category: z.array(
			z.object({
				...idColumn,
				...importColumns,
				title: z.string(),
				group: z.string(),
				single: z.string(),
				...statusColumns,
				...timestampColumns
			})
		),
		bill: z.array(
			z.object({
				...idColumn,
				...importColumns,
				title: z.string(),
				...statusColumns,
				...timestampColumns
			})
		),
		budget: z.array(
			z.object({
				...idColumn,
				...importColumns,
				title: z.string(),
				...statusColumns,
				...timestampColumns
			})
		),
		label: z.array(
			z.object({
				...idColumn,
				...importColumns,
				title: z.string(),
				...statusColumns,
				...timestampColumns
			})
		),
		labelsToJournals: z.array(
			z.object({
				...idColumn,
				labelId: z.string(),
				journalId: z.string(),
				...timestampColumns
			})
		),
		transaction: z.array(
			z.object({
				...idColumn,
				...timestampColumns
			})
		),
		journalEntry: z.array(
			z.object({
				...idColumn,
				...importColumns,
				uniqueId: z.string().nullable(),
				amount: z.number(),
				transactionId: z.string(),
				description: z.string(),
				date: z.date(),
				dateText: z.string(),
				tagId: z.string().nullable(),
				billId: z.string().nullable(),
				budgetId: z.string().nullable(),
				categoryId: z.string().nullable(),
				accountId: z.string(),

				yearMonthDay: z.string(),
				yearWeek: z.string(),
				yearMonth: z.string(),
				yearQuarter: z.string(),
				year: z.string(),

				linked: z.boolean(),
				reconciled: z.boolean(),
				dataChecked: z.boolean(),
				complete: z.boolean(),

				transfer: z.boolean(),

				...timestampColumns
			})
		),
		importItemDetail: z.array(
			z.object({
				...idColumn,
				importId: z.string(),
				status: z.enum(importDetailStatusEnum),
				duplicateId: z.string().nullable(),
				uniqueId: z.string().nullable(),
				relationId: z.string().nullable(),
				relation2Id: z.string().nullable(),
				importInfo: z.unknown(),
				processedInfo: z
					.object({
						dataToUse: z.record(z.unknown()).optional(),
						source: z.record(z.unknown()).optional(),
						processed: z.record(z.unknown()).optional()
					})
					.nullable()
					.optional(),
				errorInfo: z
					.object({
						error: z.record(z.unknown()).optional(),
						errors: z.array(z.string()).optional()
					})
					.nullable()
					.optional(),
				...timestampColumns
			})
		),
		importTable: z.array(
			z.object({
				...idColumn,
				...timestampColumns,
				title: z.string(),
				filename: z.string().nullable(),
				checkImportedOnly: z.boolean(),
				status: z.enum(importStatusEnum),
				source: z.enum(importSourceEnum),
				type: z.enum(importTypeEnum),
				importMappingId: z.string().nullable(),
				errorInfo: z.unknown()
			})
		),
		reusableFilter: z.array(
			z.object({
				...idColumn,
				...timestampColumns,
				title: z.string(),
				group: z.string().nullable(),
				journalCount: z.number(),
				canApply: z.boolean(),
				needsUpdate: z.boolean(),
				applyAutomatically: z.boolean(),
				applyFollowingImport: z.boolean(),
				listed: z.boolean(),
				modificationType: z.enum(reusableFilterModifcationType).nullable(),
				filter: z.string(),
				filterText: z.string(),
				change: z.string().nullable(),
				changeText: z.string().nullable()
			})
		),
		importMapping: z.array(
			z.object({
				...idColumn,
				...timestampColumns,
				title: z.string(),
				configuration: z.string(),
				sampleData: z.string().nullable()
			})
		)
	})
});

export type BackupSchemaRev01Type = z.infer<typeof backupSchemaRev01>;
