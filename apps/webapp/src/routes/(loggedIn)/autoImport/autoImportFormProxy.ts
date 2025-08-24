import type { FormFieldProxy } from 'sveltekit-superforms';

import type { AutoImportFrequencyType, AutoImportTypesType } from '@totallator/shared';

// title: z.string(),
// enabled: z.boolean().optional().default(false),
// importMappingId: z.string(),
// frequency: z.enum(autoImportFrequencyEnum).optional().default('daily'),
// type: z.enum(autoImportTypes),
// connectionId: z.string().optional(),
// accountId: z.string().optional(),
// startDate: z
//     .string()
//     .regex(/^\d{4}-\d{2}-\d{2}$/)
//     .optional(),
// appId: z.string().optional(),
// secret: z.string().optional(),
// lookbackDays: z.number().optional().default(5),
// userAccessToken: z.string().optional(),
// appAccessToken: z.string().optional()

export type AutoImportFormProxy = {
	title: FormFieldProxy<string | undefined, 'title'>;
	enabled: FormFieldProxy<boolean | undefined, 'enabled'>;
	importMappingId: FormFieldProxy<string, 'importMappingId'>;
	frequency: FormFieldProxy<AutoImportFrequencyType | undefined, 'frequency'>;
	type: FormFieldProxy<AutoImportTypesType, 'type'>;
	connectionId: FormFieldProxy<string | undefined, 'connectionId'>;
	accountId: FormFieldProxy<string | undefined, 'accountId'>;
	startDate: FormFieldProxy<string | undefined, 'startDate'>;
	appId: FormFieldProxy<string | undefined, 'appId'>;
	secret: FormFieldProxy<string | undefined, 'secret'>;
	lookbackDays: FormFieldProxy<number | undefined, 'lookbackDays'>;
	userAccessToken: FormFieldProxy<string | undefined, 'userAccessToken'>;
	appAccessToken: FormFieldProxy<string | undefined, 'appAccessToken'>;
	autoProcess: FormFieldProxy<boolean | undefined, 'autoProcess'>;
	autoClean: FormFieldProxy<boolean | undefined, 'autoClean'>;
};
