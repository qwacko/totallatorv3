import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { params }
	} = serverPageInfo(data.route.id, data);

	if (!params || !params.filename || !params.id) {
		throw new Error('No params');
	}

	const fileData = await tActions.file.getThumbnail({
		db: data.locals.db,
		id: params.id
	});

	if (!fileData || !fileData.fileData) {
		throw new Error('No file info');
	}

	const fileContent = await fileData.fileData;

	return new Response(fileContent, {
		status: 200
	});
};
