import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { text } from '@sveltejs/kit';
import superjson from 'superjson';

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);

	console.log('Recommendation Requested', searchParams);

	const recommendationData = await tActions.journalView.getRecommendations({
		db: data.locals.db,
		query: searchParams
	});

	return text(superjson.stringify(recommendationData));
};
