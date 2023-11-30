import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { tagFilterToText } from '$lib/server/db/actions/helpers/tag/tagFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/client';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const tags = await tActions.tag.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = tags.page >= tags.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, tags.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const tagSummary = tActions.journal.summary({
		db,
		filter: { ...defaultJournalFilter(), tag: pageInfo.searchParams }
	});

	return {
		tags,
		searchParams: pageInfo.searchParams,
		filterText: tagFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		tagSummary,
		tagDropdowns: tActions.tag.listForDropdown({ db })
	};
};

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const actions = {
	update: async ({ request }) => {
		const form = await superValidate(request, submitValidation);

		if (!form.valid) {
			return error(400, 'Invalid form data');
		}

		try {
			await tActions.tag.update(db, form.data);
			return {
				status: 200,
				body: {
					message: 'Tag Updated'
				}
			};
		} catch (e) {
			logging.error('Tag Update Error', JSON.stringify(e, null, 2));
			return error(500, 'Error updating tag');
		}
	}
};
