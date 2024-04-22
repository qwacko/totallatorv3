import { z } from 'zod';
import { queryLogOrderByEnum } from './enum/queryLogOrderByEnum';
import { groupedQueryLogOrderByEnum } from './enum/groupedQueryLogOrderByEnum';

export const queryLogFilterWithoutPaginationSchema = z.object({
	idArray: z.array(z.string()).optional(),
	excludeIdArray: z.array(z.string()).optional(),
	textFilter: z.string().optional(),
	start: z.string().optional(),
	end: z.string().optional(),
	titleArray: z.array(z.string()).optional(),
	excludeTitleArray: z.array(z.string()).optional(),
	titleIdArray: z.array(z.string()).optional(),
	excludeTitleIdArray: z.array(z.string()).optional(),
	maxDuration: z.number().optional(),
	minDuration: z.number().optional(),
	queryArray: z.array(z.string()).optional(),
	excludeQueryArray: z.array(z.string()).optional(),
	queryIdArray: z.array(z.string()).optional(),
	excludeQueryIdArray: z.array(z.string()).optional(),
	lastMinutes: z.number().optional()
});

export type QueryLogFilterSchemaWithoutPaginationType = z.infer<
	typeof queryLogFilterWithoutPaginationSchema
>;

export const queryLogFilterSchema = queryLogFilterWithoutPaginationSchema.merge(
	z.object({
		page: z.number().default(0).optional(),
		pageSize: z.number().default(10).optional(),
		orderBy: z
			.array(z.object({ field: z.enum(queryLogOrderByEnum), direction: z.enum(['asc', 'desc']) }))
			.default([{ direction: 'desc', field: 'time' }])
			.optional()
	})
);
export type QueryLogFilterSchemaType = z.infer<typeof queryLogFilterSchema>;

export const groupedQueryLogFilterWithoutPagination = queryLogFilterWithoutPaginationSchema;

export type GroupedQueryLogFilterWithoutPaginationType = z.infer<
	typeof groupedQueryLogFilterWithoutPagination
>;

export const groupedQueryLogFilter = groupedQueryLogFilterWithoutPagination.merge(
	z.object({
		page: z.number().default(0).optional(),
		pageSize: z.number().default(10).optional(),
		orderBy: z
			.array(
				z.object({ field: z.enum(groupedQueryLogOrderByEnum), direction: z.enum(['asc', 'desc']) })
			)
			.default([{ direction: 'desc', field: 'title' }])
			.optional()
	})
);

export type GroupedQueryLogFilterType = z.infer<typeof groupedQueryLogFilter>;
