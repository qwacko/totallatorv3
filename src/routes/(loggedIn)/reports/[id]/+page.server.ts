import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/journalEntries');

	const report = await tActions.report.getReportConfig({ db, id: pageInfo.current.params?.id });
	if (!report) redirect(302, '/journalEntries');

	return {
		report
	};
};
