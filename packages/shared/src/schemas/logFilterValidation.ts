import z from 'zod';

import { logActionEnum, logDomainEnum, logLevelEnum } from './enum/logEnum';

export const logFilterValidation = z.object({
	domain: z.array(z.enum(logDomainEnum)).optional(),
	action: z.array(z.enum(logActionEnum)).optional(),
	text: z.string().optional(),
	level: z.array(z.enum(logLevelEnum)).optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	contextId: z.array(z.string()).optional(),
	requestId: z.array(z.string()).optional(),
	routeId: z.array(z.string()).optional(),
	userId: z.array(z.string()).optional(),
	url: z.array(z.string()).optional(),
	code: z.array(z.string()).optional()
});

export type LogFilterValidationType = z.infer<typeof logFilterValidation>;
export type LogFilterValidationOutputType = z.output<typeof logFilterValidation>;
