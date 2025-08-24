export type PaginationType = {
	page: number;
	pageSize: number;
	count: number;
	pageCount: number;
};

export type PaginatedResults<T extends Record<any, any>> = PaginationType & {
	data: T[];
};
