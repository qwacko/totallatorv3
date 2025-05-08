import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { tagFilterToText } from '$lib/server/db/actions/helpers/tag/tagFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { noteFormActions } from '$lib/server/noteFormActions.js';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { fileFormActions } from '$lib/server/fileFormActions';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions.js';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const tags = await tActions.tag.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = tags.page >= tags.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, tags.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const tagSummary = tActions.journalView.summary({
		db,
		filter: { ...defaultJournalFilter(), tag: pageInfo.searchParams }
	});

	const filterText = await tagFilterToText({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	return {
		tags: await tActions.associatedInfo.addToItems({
			db,
			grouping: 'tagId',
			data: await tActions.file.addToItems({
				db,
				grouping: 'tag',
				data: await tActions.note.addToItems({ db, data: tags, grouping: 'tag' })
			})
		}),
		searchParams: pageInfo.searchParams,
		filterText,
		tagSummary
	};
};

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const actions = {
	...noteFormActions,
	...fileFormActions,
	...associatedInfoFormActions,
	update: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(submitValidation));

		if (!form.valid) {
			return error(400, 'Invalid form data');
		}

		try {
			await tActions.tag.update({ db, data: form.data, id: form.data.id });
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
