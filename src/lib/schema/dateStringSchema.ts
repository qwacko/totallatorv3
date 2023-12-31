import { z } from 'zod';

export const dateStringSchema = z.coerce
	.string()
	.trim()
	.length(10)
	.regex(new RegExp(/^\d{4}-\d{2}-\d{2}/));
