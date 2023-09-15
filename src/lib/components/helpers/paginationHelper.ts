export const paginationHelper = ({
	page,
	count,
	perPage,
	buttonCount = 5
}: {
	page: number;
	count: number;
	perPage: number;
	buttonCount: number;
}) => {
	const maxPages = Math.ceil(count / perPage) - 1;
	const startingPage = Math.max(0, page - buttonCount);
	const endingPage = Math.min(page + buttonCount, maxPages);
	const buttonsToShow = Math.round(endingPage - startingPage) + 1;
	const enableNext = page < maxPages;
	const enableLast = page < maxPages;
	const enablePrev = page > 0;
	const enableFirst = page > 0;

	const returnArray = Array(buttonsToShow)
		.fill('this')
		.map((_, index) => {
			return {
				page: startingPage + index,
				current: startingPage + index === page,
				title: (startingPage + index + 1).toString()
			};
		});

	return {
		enableFirst,
		enablePrev,
		enableLast,
		enableNext,
		firstPage: 0,
		prevPage: enableFirst ? page - 1 : 0,
		lastPage: maxPages,
		nextPage: enableLast ? page + 1 : maxPages,
		maxPages,
		buttons: returnArray
	};
};
