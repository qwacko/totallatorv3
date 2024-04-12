import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateReportLayoutSchema } from '$lib/schema/reportSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging.js';
import { redirect } from '@sveltejs/kit';
import { dropdownItems } from '$lib/server/dropdownItems.js';
import { journalFilterSchemaWithoutPagination } from '$lib/schema/journalSchema.js';
import { failWrapper } from '$lib/helpers/customEnhance';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/journalEntries');

	const dateSpan = pageInfo.current.searchParams?.dateSpan;
	const pageFilter = dateSpan ? { dateSpan } : undefined;

	const report = await tActions.report.getReportConfig({
		db,
		id: pageInfo.current.params?.id,
		pageFilter
	});
	if (!report) redirect(302, '/journalEntries');

	const dropdownInfo = dropdownItems({ db });

	return {
		report,
		dateSpan,
		streamed: {
			dropdownInfo
		}
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
	},
	updateFilter: async ({ request, locals, params }) => {
		const form = await request.formData();
		const id = params.id;
		const filter = form.get('filter');

		if (!id || !filter) return;

		const data = journalFilterSchemaWithoutPagination.safeParse(JSON.parse(filter.toString()));


		if (!data.success) {
			logging.error('Update Filter Parsing Error : ', data.error.message);
			return failWrapper('Invalid Filter');
		}

		try {
			await tActions.report.upsertFilter({ db: locals.db, id, filter: data.data });
		} catch (e) {
			logging.error('Error updating report filter', e);
			return failWrapper('Error updating report filter');
		}

		return;
	}
};
