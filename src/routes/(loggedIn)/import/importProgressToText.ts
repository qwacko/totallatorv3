import type { ImportProgress } from '$lib/server/db/postgres/schema';

export const importProgressToText = (progress: ImportProgress) => {
	if (!progress) {
		return '';
	}

	const currentTime = new Date();
	const startTime = new Date(progress.startTime);

	return ` (${progress.complete}/${progress.count} - ${Math.floor((progress.complete / progress.count) * 100)}% - ${Math.floor((currentTime.getTime() - startTime.getTime()) / 1000)}s)`;
};
