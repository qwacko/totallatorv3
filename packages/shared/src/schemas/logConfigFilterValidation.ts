import z from 'zod';

import { logActionEnum, logDestinationEnum, logDomainEnum } from './enum/logEnum';

export const logConfigFilterValidation = z.object({
	domain: z.array(z.enum(logDomainEnum)).optional(),
	action: z.array(z.enum(logActionEnum)).optional(),
	destination: z.array(z.enum(logDestinationEnum)).optional()
});

export type LogFilterConfigValidationType = z.infer<typeof logConfigFilterValidation>;
export type LogFilterConfigValidationOutputType = z.output<typeof logConfigFilterValidation>;
