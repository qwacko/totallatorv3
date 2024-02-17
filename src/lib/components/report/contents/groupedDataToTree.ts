import type { ReportConfigPartItemGroupingType } from '$lib/schema/reportHelpers/reportConfigPartItemGroupingEnum';
import type { ReportConfigPartNegativeDisplayType } from '$lib/schema/reportHelpers/reportConfigPartNegativeDisplayEnum';
interface TreeNode {
	value: number;
	originalValue: number;
	name: string;
	path: string;
	children?: TreeNode[];
}

type PathDataType = { [path: string]: number };

export const groupedDataToTree = ({
	data,
	dataGrouping1,
	dataGrouping2,
	dataGrouping3,
	dataGrouping4,
	negativeDisplay
}: {
	data: { group1: string; group2: string; group3: string; group4: string; value: number }[];
	dataGrouping1: ReportConfigPartItemGroupingType;
	dataGrouping2: ReportConfigPartItemGroupingType;
	dataGrouping3: ReportConfigPartItemGroupingType;
	dataGrouping4: ReportConfigPartItemGroupingType;
	negativeDisplay: ReportConfigPartNegativeDisplayType;
}): { treeData: TreeNode[]; pathData: PathDataType } => {
	const useAbsoluteValues = negativeDisplay === 'absolute' || negativeDisplay === 'grouped';
	const isGrouped = negativeDisplay === 'grouped';
	const negativeTotal = data.reduce((acc, item) => (item.value < 0 ? acc + item.value : acc), 0);
	const positiveTotal = data.reduce((acc, item) => (item.value >= 0 ? acc + item.value : acc), 0);
	const root: TreeNode[] = isGrouped
		? [
				{
					name: 'Positive',
					value: positiveTotal,
					originalValue: positiveTotal,
					path: 'Positive',
					children: []
				},
				{
					name: 'Negative',
					value: Math.abs(negativeTotal),
					originalValue: negativeTotal,
					path: 'Negative',
					children: []
				}
			]
		: [];

	const pathData: PathDataType = {};

	const groupings: ReportConfigPartItemGroupingType[] = [
		dataGrouping1,
		dataGrouping2,
		dataGrouping3,
		dataGrouping4
	];
	const maxDepth = groupings.indexOf('none') !== -1 ? groupings.indexOf('none') : groupings.length;

	data.forEach((item) => {
		if (item.value < 0 && negativeDisplay === 'hide') {
			return; // Skip negative values if 'hide' mode is active
		}

		let currentLevel = root;
		if (isGrouped) {
			currentLevel =
				item.value >= 0 ? (root[0].children as TreeNode[]) : (root[1].children as TreeNode[]); // Choose the "Positive" or "Negative" group based on the item value
		}

		let currentPath = isGrouped ? (item.value >= 0 ? 'Positive' : 'Negative') : '';

		for (let index = 0; index < maxDepth; index++) {
			const groupName =
				item[index === 0 ? 'group1' : index === 1 ? 'group2' : index === 2 ? 'group3' : 'group4'];

			// Build the path considering the "grouped" mode
			currentPath = currentPath ? `${currentPath}/${groupName}` : groupName;

			let node = currentLevel.find((node) => node.name === groupName);

			if (!node) {
				node = { name: groupName, value: 0, path: currentPath, originalValue: 0 };
				currentLevel.push(node);
			}

			node.value += useAbsoluteValues ? Math.abs(item.value) : item.value;
			node.originalValue += item.value;
			if (!pathData[currentPath]) {
				pathData[currentPath] = 0;
			}
			pathData[currentPath] += item.value;

			if (!node.children) {
				node.children = [];
			}

			currentLevel = node.children;
		}
	});

	return { treeData: root, pathData };
};
