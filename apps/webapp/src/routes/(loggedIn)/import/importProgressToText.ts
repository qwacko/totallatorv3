import type { ImportProgress } from '@totallator/database';

export const importProgressToText = (progress: ImportProgress) => {
	if (!progress) {
		return '';
	}

	const currentTime = new Date();
	const startTime = new Date(progress.startTime);

	return ` (${progress.complete}/${progress.count} - ${Math.floor((progress.complete / progress.count) * 100)}% - ${Math.floor((currentTime.getTime() - startTime.getTime()) / 1000)}s)`;
};

export const timeSinceImportStart = (progress: ImportProgress): number => {
	if (!progress || !progress.startTime) {
		return 0;
	}

	const currentTime = new Date();
	const startTime = new Date(progress.startTime);

	return Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
};
