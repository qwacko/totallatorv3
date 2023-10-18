import { z } from 'zod';

export const downloadTypeEnum = ['default', 'import'] as const;

export const downloadTypeToString = (dType: DownloadTypeEnumType) => {
	if (dType === 'import') {
		return 'Import Style';
	}
	return 'Default Format';
};

export type DownloadTypeEnumType = (typeof downloadTypeEnum)[number];

export const downloadTypeSchema = z.object({
	downloadType: z.enum(downloadTypeEnum).default('default').optional()
});
