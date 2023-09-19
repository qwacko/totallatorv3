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
	const maxPages = Math.ceil(count / perPage);
	const halfRange = Math.floor(buttonCount / 2);

	let startingPage = page - halfRange;
	let endingPage = page + halfRange;

	// Adjust if we're too close to the start
	if (startingPage < 0) {
		endingPage -= startingPage; // subtracting a negative number is the same as adding its absolute value
		startingPage = 0;
	}

	// Adjust if we're too close to the end
	if (endingPage >= maxPages) {
		startingPage -= endingPage - maxPages + 1;
		endingPage = maxPages - 1;
	}

	// Ensure startingPage is not negative
	startingPage = Math.max(0, startingPage);

	const enableNext = page < maxPages - 1;
	const enableLast = page < maxPages - 1;
	const enablePrev = page > 0;
	const enableFirst = page > 0;

	const returnArray = Array.from({ length: endingPage - startingPage + 1 }, (_, index) => {
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
		lastPage: maxPages - 1,
		nextPage: enableLast ? page + 1 : maxPages - 1,
		maxPages,
		buttons: returnArray
	};
};
