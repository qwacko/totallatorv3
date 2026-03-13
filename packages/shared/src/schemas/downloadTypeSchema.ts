import * as z from 'zod';

export const downloadTypeEnum = ['default', 'import'] as const;
export const journalDownloadTypeEnum = ['default', 'import', 'journalUpdate'] as const;

export const downloadTypeToString = (dType: DownloadTypeEnumType) => {
	if (dType === 'import') {
		return 'Import Style';
	}
	return 'Default Format';
};

export type DownloadTypeEnumType = (typeof downloadTypeEnum)[number];
export type JournalDownloadTypeEnumType = (typeof journalDownloadTypeEnum)[number];

export const journalDownloadTypeToString = (dType: JournalDownloadTypeEnumType) => {
	if (dType === 'import') {
		return 'Transaction Import Format';
	}
	if (dType === 'journalUpdate') {
		return 'Journal Update Import Format';
	}
	return 'Default Format';
};

export const downloadTypeSchema = z.object({
	downloadType: z.enum(downloadTypeEnum).default('default').optional()
});

export const journalDownloadTypeSchema = z.object({
	downloadType: z.enum(journalDownloadTypeEnum).default('default').optional()
});
