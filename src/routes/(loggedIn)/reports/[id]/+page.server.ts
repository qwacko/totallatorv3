import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateReportLayoutSchema } from '$lib/schema/reportSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { journalExtendedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import { logging } from '$lib/server/logging.js';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	//Testing Getting Data From DB

	const testData = await db.select().from(journalExtendedView).limit(1).toSQL();
	console.log('Report Test Data', testData);

	if (!pageInfo.current.params?.id) redirect(302, '/journalEntries');

	const report = await tActions.report.getReportConfig({ db, id: pageInfo.current.params?.id });
	if (!report) redirect(302, '/journalEntries');

	return {
		report
	};
};

export const actions = {
	updateLayout: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id');
		const reportElements = form.get('reportElements');

		if (!id || !reportElements) return;

		const data = updateReportLayoutSchema.safeParse({
			id: id.toString(),
			reportElements: JSON.parse(reportElements.toString())
		});

		if (!data.success) return;

		try {
			await tActions.report.updateLayout({ db: locals.db, layoutConfig: data.data });
		} catch (e) {
			logging.error('Error updating report layout', e);
			return;
		}

		return;
	}
};
