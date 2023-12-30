import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { params }
	} = serverPageInfo(data.route.id, data);

	if (!params || !params.filename) {
		throw new Error('No params');
	}

	const fileData = (await tActions.backup.getBackupData({
		filename: params.filename,
		returnRaw: true
	})) as string;

	return new Response(fileData, {
		headers: {
			'Content-Type': 'text/plain',
			'Content-Disposition': `attachment; filename=${params.filename}`
		}
	});
};
