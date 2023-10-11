type DBEntry = {
	transactionId: string | null;
	journalId: string | null;
	parentJournalId: string | null;
	id: string | null;
};

export function reconcileJournalsToOtherJournals(data: DBEntry[]) {
	const journalsByTransaction: { [transactionId: string]: string[] } = {};
	const existingJournalsToOtherJournals: { [key: string]: string } = {};

	const toCreate: { journalId: string; parentJournalId: string }[] = [];
	const toRemove: string[] = [];

	// Group journals by transaction and populate existing relations map
	for (const entry of data) {
		if (entry.transactionId && entry.journalId) {
			if (!journalsByTransaction[entry.transactionId]) {
				journalsByTransaction[entry.transactionId] = [];
			}
			journalsByTransaction[entry.transactionId].push(entry.journalId);
		} else {
			if (entry.id) {
				toRemove.push(entry.id);
			}
		}

		if (entry.id) {
			const relationKey = `${entry.journalId}-${entry.parentJournalId}`;
			existingJournalsToOtherJournals[relationKey] = entry.id;
		}
	}

	for (const transactionId in journalsByTransaction) {
		const journals = journalsByTransaction[transactionId];
		for (const journal of journals) {
			for (const otherJournal of journals) {
				if (journal !== otherJournal) {
					const relationKey = `${journal}-${otherJournal}`;
					if (!existingJournalsToOtherJournals[relationKey]) {
						toCreate.push({
							journalId: journal,
							parentJournalId: otherJournal
						});
					} else {
						delete existingJournalsToOtherJournals[relationKey];
					}
				}
			}
		}
	}

	for (const key in existingJournalsToOtherJournals) {
		const [journal, parentJournal] = key.split('-');
		if (!journal || !parentJournal) {
			toRemove.push(existingJournalsToOtherJournals[key]);
		}
	}

	return {
		toCreate,
		toRemove
	};
}
