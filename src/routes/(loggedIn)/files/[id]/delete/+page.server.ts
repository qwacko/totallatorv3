import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { redirect } from '@sveltejs/kit';
import { urlGenerator } from '$lib/routes';
import { fileFormActions } from '$lib/server/fileFormActions';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params?.id) {
		throw new Error('No id provided');
	}

	const fileInfo = await tActions.file.list({
		db: data.locals.db,
		filter: { idArray: [current.params.id] }
	});

	if (!fileInfo) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/files', searchParamsValue: {} }).url);
	}

	if (fileInfo.data.length === 0) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/files', searchParamsValue: {} }).url);
	}

	return {
		id: current.params.id,
		file: fileInfo.data[0]
	};
};

export const actions = fileFormActions;
