<script lang="ts">
	import type { TransactionHistoryItemType } from '@totallator/business-logic';
	import { formatDate, getCurrencyFormatter } from '@totallator/shared';

	import { currencyFormat, userDateFormat } from '$lib/stores/userInfoStore';
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';

	const { item }: { item: TransactionHistoryItemType } = $props();

	const actorText = $derived(
		item.actorUserName || item.sourceImportTitle || item.sourceFilterTitle || item.sourceType
	);
	const beforeJournals = $derived(item.beforeSnapshot?.journals || []);
	const afterJournals = $derived(item.afterSnapshot?.journals || []);
	const formatter = $derived(getCurrencyFormatter($currencyFormat));

	const displayLinkedItem = (item: { id: string | null; title: string | null }) =>
		item.title || item.id || 'None';

	const displayLabels = (labels: { id: string | null; title: string | null }[]) =>
		labels.length > 0
			? labels.map((label) => label.title || label.id || 'Unknown').join(', ')
			: 'None';

	const displayFlags = (journal: (typeof beforeJournals)[number] | (typeof afterJournals)[number]) =>
		[
			journal.linked ? 'Linked' : 'Unlinked',
			journal.reconciled ? 'Reconciled' : 'Unreconciled',
			journal.dataChecked ? 'Checked' : 'Unchecked',
			journal.complete ? 'Complete' : 'Incomplete',
			journal.transfer ? 'Transfer' : 'Non-transfer'
		].join(', ');

	const pushFlagChange = ({
		changes,
		journalName,
		label,
		beforeValue,
		afterValue,
		trueText,
		falseText
	}: {
		changes: string[];
		journalName: string;
		label: string;
		beforeValue: boolean;
		afterValue: boolean;
		trueText?: string;
		falseText?: string;
	}) => {
		if (beforeValue === afterValue) {
			return;
		}
		if (trueText && falseText) {
			changes.push(
				`${journalName}: ${label} ${formatTransition(
					beforeValue ? trueText : falseText,
					afterValue ? trueText : falseText
				)}`
			);
			return;
		}
		changes.push(
			`${journalName}: ${label} ${formatTransition(
				beforeValue ? 'enabled' : 'disabled',
				afterValue ? 'enabled' : 'disabled'
			)}`
		);
	};

	const pickRepresentativeJournal = (
		journals: (typeof beforeJournals | typeof afterJournals) extends infer T
			? T extends Array<infer U>
				? U[]
				: never
			: never
	) => {
		const positiveJournal = journals.find((journal) => journal.amount >= 0);
		return positiveJournal || journals[0];
	};

	const isLinkedTransaction = (journals: typeof beforeJournals | typeof afterJournals) =>
		journals.length > 1 && journals.every((journal) => journal.linked);

	const formatTransition = (beforeValue: string, afterValue: string) => `${beforeValue} -> ${afterValue}`;
	const formatAmount = (value: number) => formatter.format(value);

	const createSummaryLines = (currentItem: TransactionHistoryItemType) => {
		if (currentItem.changeType === 'create') {
			return ['Transaction created'];
		}
		if (currentItem.changeType === 'delete') {
			return ['Transaction deleted'];
		}

		const useLinkedMode =
			isLinkedTransaction(beforeJournals) || isLinkedTransaction(afterJournals);
		const normalizedBeforeJournals = useLinkedMode
			? beforeJournals.length > 0
				? [pickRepresentativeJournal(beforeJournals)]
				: []
			: beforeJournals;
		const normalizedAfterJournals = useLinkedMode
			? afterJournals.length > 0
				? [pickRepresentativeJournal(afterJournals)]
				: []
			: afterJournals;

		const beforeMap = new Map(normalizedBeforeJournals.map((journal) => [journal.id, journal]));
		const afterMap = new Map(normalizedAfterJournals.map((journal) => [journal.id, journal]));
		const journalIds = [...new Set([...beforeMap.keys(), ...afterMap.keys()])];
		const changes: string[] = [];

		for (const journalId of journalIds) {
			const beforeJournal = beforeMap.get(journalId);
			const afterJournal = afterMap.get(journalId);
			const journalName = useLinkedMode
				? ''
				: afterJournal?.account.title ||
					beforeJournal?.account.title ||
					afterJournal?.account.id ||
					beforeJournal?.account.id ||
					journalId;

			if (!beforeJournal && afterJournal) {
				changes.push(`${journalName}: journal added`);
				continue;
			}
			if (beforeJournal && !afterJournal) {
				changes.push(`${journalName}: journal removed`);
				continue;
			}
			if (!beforeJournal || !afterJournal) {
				continue;
			}

			if (
				!useLinkedMode &&
				displayLinkedItem(beforeJournal.account) !== displayLinkedItem(afterJournal.account)
			) {
				changes.push(
					`${journalName}: account ${formatTransition(
						displayLinkedItem(beforeJournal.account),
						displayLinkedItem(afterJournal.account)
					)}`
				);
			}
			if (beforeJournal.amount !== afterJournal.amount) {
				changes.push(
					`${journalName}: amount ${formatTransition(
						formatAmount(beforeJournal.amount),
						formatAmount(afterJournal.amount)
					)}`
				);
			}
			if (beforeJournal.dateText !== afterJournal.dateText) {
				changes.push(
					`${journalName}: date ${formatTransition(beforeJournal.dateText, afterJournal.dateText)}`
				);
			}
			if (beforeJournal.description !== afterJournal.description) {
				changes.push(
					`${journalName}: description ${formatTransition(
						beforeJournal.description,
						afterJournal.description
					)}`
				);
			}
			if (displayLinkedItem(beforeJournal.category) !== displayLinkedItem(afterJournal.category)) {
				changes.push(
					`${journalName}: category ${formatTransition(
						displayLinkedItem(beforeJournal.category),
						displayLinkedItem(afterJournal.category)
					)}`
				);
			}
			if (displayLinkedItem(beforeJournal.tag) !== displayLinkedItem(afterJournal.tag)) {
				changes.push(
					`${journalName}: tag ${formatTransition(
						displayLinkedItem(beforeJournal.tag),
						displayLinkedItem(afterJournal.tag)
					)}`
				);
			}
			if (displayLinkedItem(beforeJournal.bill) !== displayLinkedItem(afterJournal.bill)) {
				changes.push(
					`${journalName}: bill ${formatTransition(
						displayLinkedItem(beforeJournal.bill),
						displayLinkedItem(afterJournal.bill)
					)}`
				);
			}
			if (displayLinkedItem(beforeJournal.budget) !== displayLinkedItem(afterJournal.budget)) {
				changes.push(
					`${journalName}: budget ${formatTransition(
						displayLinkedItem(beforeJournal.budget),
						displayLinkedItem(afterJournal.budget)
					)}`
				);
			}
			if (displayLabels(beforeJournal.labels) !== displayLabels(afterJournal.labels)) {
				changes.push(
					`${journalName}: labels ${formatTransition(
						displayLabels(beforeJournal.labels),
						displayLabels(afterJournal.labels)
					)}`
				);
			}
			pushFlagChange({
				changes,
				journalName,
				label: 'linked',
				beforeValue: beforeJournal.linked,
				afterValue: afterJournal.linked,
				trueText: 'Linked',
				falseText: 'Unlinked'
			});
			pushFlagChange({
				changes,
				journalName,
				label: 'reconciled',
				beforeValue: beforeJournal.reconciled,
				afterValue: afterJournal.reconciled,
				trueText: 'Reconciled',
				falseText: 'Unreconciled'
			});
			pushFlagChange({
				changes,
				journalName,
				label: 'data checked',
				beforeValue: beforeJournal.dataChecked,
				afterValue: afterJournal.dataChecked,
				trueText: 'Checked',
				falseText: 'Unchecked'
			});
			pushFlagChange({
				changes,
				journalName,
				label: 'complete',
				beforeValue: beforeJournal.complete,
				afterValue: afterJournal.complete,
				trueText: 'Complete',
				falseText: 'Incomplete'
			});
			pushFlagChange({
				changes,
				journalName,
				label: 'transfer',
				beforeValue: beforeJournal.transfer,
				afterValue: afterJournal.transfer,
				trueText: 'Transfer',
				falseText: 'Non-transfer'
			});
		}

		if (changes.length > 0) {
			return changes;
		}

		if (currentItem.changedFields && currentItem.changedFields.length > 0) {
			return currentItem.changedFields.map((field) => `Changed ${field}`);
		}

		return ['No material change recorded'];
	};

	const summaryLines = $derived(createSummaryLines(item));
	const linkedTransactionMode = $derived(
		isLinkedTransaction(beforeJournals) || isLinkedTransaction(afterJournals)
	);
	const comparisonJournalIds = $derived(
		linkedTransactionMode
			? [
					(
						pickRepresentativeJournal(afterJournals.length > 0 ? afterJournals : beforeJournals)?.id ||
						''
					)
				].filter(Boolean)
			: [...new Set([...beforeJournals.map((journal) => journal.id), ...afterJournals.map((journal) => journal.id)])]
	);

	const buildTransitionParts = (value: string) => {
		const fieldLabels = [
			'account',
			'amount',
			'date',
			'description',
			'category',
			'tag',
			'bill',
			'budget',
			'labels',
			'linked',
			'reconciled',
			'data checked',
			'complete',
			'transfer'
		];
		const matchedLabel = fieldLabels.find((label) => value.startsWith(`${label} `));
		const valueWithoutLabel = matchedLabel ? value.slice(matchedLabel.length + 1) : value;
		const parts = valueWithoutLabel.split(' -> ');
		if (parts.length === 2) {
			return {
				label: matchedLabel ? capitalize(matchedLabel) : null,
				from: parts[0],
				to: parts[1]
			};
		}
		return null;
	};

	const capitalize = (value: string) => (value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value);
</script>

<details class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
	<summary class="cursor-pointer list-none">
		<div class="flex flex-wrap items-center gap-2 text-sm">
			<span class="font-semibold capitalize">{item.changeType}</span>
			<span class="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase dark:bg-gray-800">
				{item.sourceType}
			</span>
			<span>{formatDate(item.createdAt, $userDateFormat)}</span>
			{#if actorText}
				<span class="text-gray-600 dark:text-gray-300">{actorText}</span>
			{/if}
		</div>

		{#if item.summary}
			<div class="mt-2 text-sm text-gray-700 dark:text-gray-300">{item.summary}</div>
		{/if}

		<div class="mt-2 flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
			{#each summaryLines.slice(0, 4) as line}
				{@const splitIndex = line.indexOf(': ')}
				{@const rawPrefix = splitIndex >= 0 ? line.slice(0, splitIndex) : ''}
				{@const prefix = rawPrefix ? `${capitalize(rawPrefix)}:` : ''}
				{@const suffix = splitIndex >= 0 ? line.slice(splitIndex + 2) : line}
				{@const transition = buildTransitionParts(suffix)}
				<div class="flex flex-wrap items-start gap-1">
					{#if prefix}
						<span class="font-medium">{prefix}</span>
					{/if}
					{#if transition}
						{#if transition.label}
							<span class="font-medium">{transition.label}</span>
						{/if}
						<span class="max-w-full rounded bg-gray-100 px-2 py-0.5 text-xs break-words dark:bg-gray-800">
							{transition.from}
						</span>
						<ArrowRightIcon class="mt-0.5 h-3 w-3 shrink-0 text-gray-500" />
						<span class="max-w-full rounded bg-blue-50 px-2 py-0.5 text-xs break-words text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
							{transition.to}
						</span>
					{:else}
						<span class="break-words">{suffix}</span>
					{/if}
				</div>
			{/each}
			{#if summaryLines.length > 4}
				<div class="text-xs text-gray-500">+{summaryLines.length - 4} more changes</div>
			{/if}
		</div>
	</summary>

	<div class="mt-4 space-y-4">
		{#if item.changedFields && item.changedFields.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each item.changedFields.slice(0, 20) as field}
					<span class="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
						{field}
					</span>
				{/each}
			</div>
		{/if}

		{#if comparisonJournalIds.length === 0}
			<div class="text-sm text-gray-500">No snapshot data recorded for this change.</div>
		{:else}
			{#each comparisonJournalIds as journalId}
				{@const beforeJournal = linkedTransactionMode
					? pickRepresentativeJournal(beforeJournals)
					: beforeJournals.find((journal) => journal.id === journalId)}
				{@const afterJournal = linkedTransactionMode
					? pickRepresentativeJournal(afterJournals)
					: afterJournals.find((journal) => journal.id === journalId)}
				<div class="rounded border border-gray-100 p-3 dark:border-gray-800">
					<div class="mb-3 font-medium">
						{#if linkedTransactionMode}
							Linked transaction
						{:else}
							{afterJournal?.account.title ||
								beforeJournal?.account.title ||
								afterJournal?.account.id ||
								beforeJournal?.account.id ||
								journalId}
						{/if}
					</div>

					<div class="grid gap-3 @lg:grid-cols-2">
						<div class="rounded bg-gray-50 p-3 dark:bg-gray-900/50">
							<div class="mb-2 text-xs font-semibold uppercase text-gray-500">Before</div>
							{#if beforeJournal}
								<div class="grid grid-cols-[110px_1fr] gap-y-1 text-sm">
									{#if !linkedTransactionMode}
										<div class="text-gray-500">Account</div>
										<div>{displayLinkedItem(beforeJournal.account)}</div>
									{/if}
									<div class="text-gray-500">Amount</div>
									<div>{formatAmount(beforeJournal.amount)}</div>
									<div class="text-gray-500">Date</div>
									<div>{beforeJournal.dateText}</div>
									<div class="text-gray-500">Description</div>
									<div class="break-words">{beforeJournal.description}</div>
									<div class="text-gray-500">Category</div>
									<div>{displayLinkedItem(beforeJournal.category)}</div>
									<div class="text-gray-500">Tag</div>
									<div>{displayLinkedItem(beforeJournal.tag)}</div>
									<div class="text-gray-500">Bill</div>
									<div>{displayLinkedItem(beforeJournal.bill)}</div>
									<div class="text-gray-500">Budget</div>
									<div>{displayLinkedItem(beforeJournal.budget)}</div>
									<div class="text-gray-500">Labels</div>
									<div>{displayLabels(beforeJournal.labels)}</div>
									<div class="text-gray-500">Flags</div>
									<div>{displayFlags(beforeJournal)}</div>
								</div>
							{:else}
								<div class="text-sm text-gray-500">No previous journal snapshot</div>
							{/if}
						</div>

						<div class="rounded bg-gray-50 p-3 dark:bg-gray-900/50">
							<div class="mb-2 text-xs font-semibold uppercase text-gray-500">After</div>
							{#if afterJournal}
								<div class="grid grid-cols-[110px_1fr] gap-y-1 text-sm">
									{#if !linkedTransactionMode}
										<div class="text-gray-500">Account</div>
										<div>{displayLinkedItem(afterJournal.account)}</div>
									{/if}
									<div class="text-gray-500">Amount</div>
									<div>{formatAmount(afterJournal.amount)}</div>
									<div class="text-gray-500">Date</div>
									<div>{afterJournal.dateText}</div>
									<div class="text-gray-500">Description</div>
									<div class="break-words">{afterJournal.description}</div>
									<div class="text-gray-500">Category</div>
									<div>{displayLinkedItem(afterJournal.category)}</div>
									<div class="text-gray-500">Tag</div>
									<div>{displayLinkedItem(afterJournal.tag)}</div>
									<div class="text-gray-500">Bill</div>
									<div>{displayLinkedItem(afterJournal.bill)}</div>
									<div class="text-gray-500">Budget</div>
									<div>{displayLinkedItem(afterJournal.budget)}</div>
									<div class="text-gray-500">Labels</div>
									<div>{displayLabels(afterJournal.labels)}</div>
									<div class="text-gray-500">Flags</div>
									<div>{displayFlags(afterJournal)}</div>
								</div>
							{:else}
								<div class="text-sm text-gray-500">No current journal snapshot</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</details>
