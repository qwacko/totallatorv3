import Papa from 'papaparse';
import type { ServerRouteConfig } from 'skroutes';
import z from 'zod';

import { tActions } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.server.js';

const exportScopeSchema = z.enum(['errors', 'all']).default('all');

export const _routeConfig = {
	searchParamsValidation: z
		.object({
			scope: exportScopeSchema.optional()
		})
		.optional()
		.catch({})
} satisfies ServerRouteConfig[string];

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);
	const importId = data.params.id;

	const scope = exportScopeSchema.parse(searchParams?.scope);
	const importDetail = await tActions.import.getDetail({ id: importId });

	const rows = importDetail.detail.importDetails
		.filter((item) =>
			scope === 'errors' ? item.status === 'error' || item.status === 'importError' : true
		)
		.map((item, index) => {
			const source = item.processedInfo?.source ?? undefined;
			const processed = item.processedInfo?.dataToUse ?? undefined;
			const processedRow = source && typeof source === 'object' ? source : {};
			return {
				rowNumber: index + 1,
				status: item.status,
				statusText: item.statusText ?? '',
				uniqueId: item.uniqueId ?? '',
				relationId: item.relationId ?? '',
				relation2Id: item.relation2Id ?? '',
				errorInfo: item.errorInfo ? JSON.stringify(item.errorInfo) : '',
				processedInfo: processed ? JSON.stringify(processed) : '',
				importInfo: item.importInfo ? JSON.stringify(item.importInfo) : '',
				...processedRow
			};
		});

	const csvData = Papa.unparse(rows);
	const dateText = new Date().toISOString().slice(0, 19);
	const filename =
		scope === 'errors'
			? `${dateText}-import-${importId}-errors.csv`
			: `${dateText}-import-${importId}-all.csv`;

	return new Response(csvData, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename=${filename}`
		}
	});
};
