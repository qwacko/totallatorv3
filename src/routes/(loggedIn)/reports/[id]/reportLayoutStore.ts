import type { ReportLayoutConfigType } from '$lib/server/db/actions/reportActions';
import { derived, writable } from 'svelte/store';

export const reportLayoutStore = (reportData: ReportLayoutConfigType) => {
	const reportLayoutStore = writable<ReportLayoutConfigType>({
		...reportData,
		reportElements: reportData.reportElements.sort((a, b) => a.order - b.order)
	});

	const reportLayoutStringStore = derived(reportLayoutStore, (currentData) => {
		const dataForStorage = currentData.reportElements.map((item) => ({
			id: item.id,
			cols: item.cols,
			title: item.title,
			rows: item.rows,
			order: item.order
		}));

		return JSON.stringify(dataForStorage);
	});

	const moveUp = (id: string) => {
		reportLayoutStore.update((reportData) => {
			const index = reportData.reportElements.findIndex((el) => el.id === id);
			if (index === 0) return reportData;

			const targetPosition = reportData.reportElements[index].order;
			if (targetPosition === 1) return reportData;
			return {
				...reportData,
				reportElements: reportData.reportElements
					.map((item) => ({
						...item,
						order:
							item.order === targetPosition - 1
								? targetPosition
								: item.order === targetPosition
									? targetPosition - 1
									: item.order
					}))
					.sort((a, b) => a.order - b.order)
			};
		});
	};

	const moveDown = (id: string) => {
		reportLayoutStore.update((reportData) => {
			const index = reportData.reportElements.findIndex((el) => el.id === id);
			if (index === reportData.reportElements.length - 1) return reportData;

			const targetPosition = reportData.reportElements[index].order;
			if (targetPosition === reportData.reportElements.length) return reportData;
			return {
				...reportData,
				reportElements: reportData.reportElements
					.map((item) => ({
						...item,
						order:
							item.order === targetPosition + 1
								? targetPosition
								: item.order === targetPosition
									? targetPosition + 1
									: item.order
					}))
					.sort((a, b) => a.order - b.order)
			};
		});
	};

	const changeWidth = (id: string, change: number) => {
		reportLayoutStore.update((reportData) => {
			return {
				...reportData,
				reportElements: reportData.reportElements.map((item) => {
					if (item.id === id) {
						return { ...item, cols: item.cols + change };
					}
					return item;
				})
			};
		});
	};

	const changeHeight = (id: string, change: number) => {
		reportLayoutStore.update((reportData) => {
			return {
				...reportData,
				reportElements: reportData.reportElements.map((item) => {
					if (item.id === id) {
						return { ...item, rows: item.rows + change };
					}
					return item;
				})
			};
		});
	};

	return {
		...reportLayoutStore,
		reportLayoutStringStore,
		moveUp,
		moveDown,
		changeHeight,
		changeWidth
	};
};
