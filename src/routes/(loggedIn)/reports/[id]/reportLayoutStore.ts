import type { ReportLayoutConfigType } from '$lib/server/db/actions/reportActions';
import { nanoid } from 'nanoid';
import { derived, get, writable } from 'svelte/store';

type ReportElementType = ReportLayoutConfigType['reportElements'][number];

type NewReportElementType = {
	id: string;
	cols: number;
	rows: number;
	order: number;
	title: string;
};

type ReportLayoutConfigWithNew = {
	[K in keyof ReportLayoutConfigType]: K extends 'reportElements'
		? Array<ReportElementType | NewReportElementType>
		: ReportLayoutConfigType[K];
};

export const reportLayoutStore = (reportData: ReportLayoutConfigType) => {
	const reportLayoutStore = writable<ReportLayoutConfigWithNew>({
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

	const fixOrderNumbers = () => {
		reportLayoutStore.update((reportData) => {
			return {
				...reportData,
				reportElements: reportData.reportElements
					.sort((a, b) => a.order - b.order)
					.map((item, index) => ({ ...item, order: index + 1 }))
			};
		});
	};

	const addElement = () => {
		const maxOrder = get(reportLayoutStore).reportElements.reduce((acc, item) => {
			return item.order > acc ? item.order : acc;
		}, 0);
		const newId = `new${nanoid()}`;
		reportLayoutStore.update((currentReportData) => {
			return {
				...currentReportData,
				reportElements: [
					...currentReportData.reportElements,
					{
						id: newId,
						cols: 1,
						rows: 1,
						order: maxOrder + 1,
						title: 'New'
					}
				]
			};
		});
		fixOrderNumbers();
	};

	const removeElement = (id: string) => {
		reportLayoutStore.update((reportData) => {
			return {
				...reportData,
				reportElements: reportData.reportElements.filter((item) => item.id !== id)
			};
		});
		fixOrderNumbers();
	};

	const reset = () => {
		reportLayoutStore.set({
			...reportData,
			reportElements: reportData.reportElements.sort((a, b) => a.order - b.order)
		});
		fixOrderNumbers();
	};

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
		fixOrderNumbers();
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
		fixOrderNumbers();
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
		fixOrderNumbers();
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
		fixOrderNumbers();
	};

	return {
		...reportLayoutStore,
		reportLayoutStringStore,
		moveUp,
		moveDown,
		changeHeight,
		changeWidth,
		reset,
		addElement,
		removeElement
	};
};
