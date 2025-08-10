import type { DBType } from '@totallator/database';
import { evaluate } from 'mathjs';
import type { GetDataForFilterKeyType } from './getCombinedFilters';
import { getFiltersFromMathConfig } from './getFiltersFromMathConfig';
import type { ReportConfigPartSchemaNonTimeGraphType } from '@totallator/shared';
import { reportConfigPartItemGroupingInfo } from '@totallator/shared';

export const groupedMathConfigToNumber = async ({
	db,
	config,
	getDataFromKey
}: {
	db: DBType;
	config: ReportConfigPartSchemaNonTimeGraphType;
	getDataFromKey: GetDataForFilterKeyType;
}) => {
	const { emptyTitle: emptyTitle1 } = reportConfigPartItemGroupingInfo[config.itemGrouping];
	const { emptyTitle: emptyTitle2 } = reportConfigPartItemGroupingInfo[config.itemGrouping2];
	const { emptyTitle: emptyTitle3 } = reportConfigPartItemGroupingInfo[config.itemGrouping3];
	const { emptyTitle: emptyTitle4 } = reportConfigPartItemGroupingInfo[config.itemGrouping4];
	let mathConfigInt = config.mathConfig;

	//Extract all the filtesr from mathConfig which are identified by being surrpounded by curly braces
	const filters = getFiltersFromMathConfig(mathConfigInt);

	const dataInformation: {
		[groupTitle: string]: {
			mathConfig: string;
			group1: string;
			group2: string;
			group3: string;
			group4: string;
			filterInfo: { [filterKey: string]: number };
		};
	} = {};

	//Check if the filters are allowed
	if (filters) {
		for (const filter of filters) {
			const filterKey = filter.targetFilter;
			const replacementNumber = await getDataFromKey({
				db,
				key: filterKey,
				allowSingle: false,
				allowTime: false,
				allowGrouping: true,
				dataGrouping: config.itemGrouping,
				dataGrouping2: config.itemGrouping2,
				dataGrouping3: config.itemGrouping3,
				dataGrouping4: config.itemGrouping4
			});
			if ('errorMessage' in replacementNumber) {
				return { error: true, errorMessage: replacementNumber.errorMessage };
			}

			if ('timeSeriesData' in replacementNumber) {
				return { error: true, errorMessage: `Time Series Data not allowed in Grouped Data Query` };
			}

			if ('singleValue' in replacementNumber) {
				return { error: true, errorMessage: `Single Value Data not allowed in Grouped Data Query` };
			}

			//Update Data Information with data from the filter:
			if (replacementNumber.groupedData) {
				replacementNumber.groupedData.forEach((current) => {
					const groupTitle1 = current.group1 === true ? emptyTitle1 : current.group1 || emptyTitle1;
					const groupTitle2 = current.group2 === true ? emptyTitle2 : current.group2 || emptyTitle2;
					const groupTitle3 = current.group3 === true ? emptyTitle3 : current.group3 || emptyTitle3;
					const groupTitle4 = current.group4 === true ? emptyTitle4 : current.group4 || emptyTitle4;
					const groupTitle = `${groupTitle1}-${groupTitle2}-${groupTitle3}-${groupTitle4}`;
					if (!dataInformation[groupTitle]) {
						dataInformation[groupTitle] = {
							mathConfig: mathConfigInt,
							group1: groupTitle1,
							group2: groupTitle2,
							group3: groupTitle3,
							group4: groupTitle4,
							filterInfo: {}
						};
					}
					dataInformation[groupTitle].filterInfo[filterKey] = current.value;
				});
			}
		}
	}

	try {
		const groupKeys = Object.keys(dataInformation);

		const groupResults = groupKeys.map((groupKey) => {
			const currentGroup = dataInformation[groupKey];
			let mathConfigInt = currentGroup.mathConfig;

			for (const filter of filters) {
				mathConfigInt = mathConfigInt.replace(
					filter.targetText,
					(currentGroup.filterInfo[filter.targetFilter] || 0).toString()
				);
			}

			return {
				group1: currentGroup.group1,
				group2: currentGroup.group2,
				group3: currentGroup.group3,
				group4: currentGroup.group4,
				value: Number(evaluate(mathConfigInt))
			};
		});

		return { data: groupResults };
	} catch (err) {
		// logging.error('Error Processing Math Request : ', { query: mathConfigInt, err });
		return { error: true, errorMessage: `Math Request Malformed. Query = ${mathConfigInt}` };
	}
};
