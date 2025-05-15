<script lang="ts">
	import type { RecommendationType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import { Badge, Button, Card, P, Spinner } from 'flowbite-svelte';
	import {
		accountDropdownData,
		tagDropdownData,
		billDropdownData,
		budgetDropdownData,
		categoryDropdownData
	} from '$lib/stores/dropdownStores.js';
	import { formatDate, getCurrencyFormatter } from '$lib/schema/userSchema';
	import { currencyFormat, userDateFormat } from '$lib/stores/userInfoStore';
	import SaveIcon from './icons/SaveIcon.svelte';
	import AddIcon from './icons/AddIcon.svelte';

	const {
		recommendation,
		update,
		updateAndSave,
		loadingUpdate,
		loadingUpdateAndSave
	}: {
		recommendation: RecommendationType;
		update?: () => void;
		updateAndSave?: () => void;
		loadingUpdate?: string | undefined;
		loadingUpdateAndSave?: string | undefined;
	} = $props();

	const updateAndSaveActive = $derived(loadingUpdateAndSave === recommendation.journalId);
	const updateActive = $derived(loadingUpdate === recommendation.journalId);
</script>

{#snippet DisplayItemBadge(id: string, items: { id: string; title: string }[] | undefined)}
	{#if items}
		{@const item = items.find((item) => item.id === id)}
		{#if item}
			<Badge>
				{item.title}
			</Badge>
		{/if}
	{/if}
{/snippet}

{#snippet displaySimilarText(targetText: string, searchText: string)}
	{#if targetText && searchText}
		{#each targetText.split(' ') as word}
			{#if searchText.toLocaleLowerCase().includes(word.toLocaleLowerCase())}
				<strong>{word}</strong>
				{' '}
			{:else}
				{word}{' '}
			{/if}
		{/each}
	{/if}
{/snippet}

{#snippet displayItem()}
	<div class="flex flex-row items-center gap-4">
		<P size="2xl" class="p-2">{(recommendation.checkSimilarity * 100).toFixed(0)}%</P><P>
			{@render displaySimilarText(
				recommendation.checkDescription,
				recommendation.searchDescription
			)}
		</P>
	</div>
	<div class="flex flex-row items-center gap-4">
		<P color="text-slate-600 dark:text-slate-600">Dates:</P>
		<P italic color="text-slate-600 dark:text-slate-600">
			{formatDate(recommendation.journalDate, $userDateFormat)}
		</P>
		<P color="text-slate-600 dark:text-slate-600">Amount:</P>
		<P italic color="text-slate-600 dark:text-slate-600">
			{getCurrencyFormatter($currencyFormat).format(recommendation.journalAmount)}
		</P>
	</div>
	<P class="flex">{recommendation.journalDescription}</P>
	<div class="item-center flex flex-row flex-wrap gap-2">
		{#if recommendation.payeeAccountId}
			{@render DisplayItemBadge(recommendation.payeeAccountId, $accountDropdownData)}
		{/if}
		{#if recommendation.journalTagId}
			{@render DisplayItemBadge(recommendation.journalTagId, $tagDropdownData)}
		{/if}
		{#if recommendation.journalBillId}
			{@render DisplayItemBadge(recommendation.journalBillId, $billDropdownData)}
		{/if}
		{#if recommendation.journalBudgetId}
			{@render DisplayItemBadge(recommendation.journalBudgetId, $budgetDropdownData)}
		{/if}
		{#if recommendation.journalCategoryId}
			{@render DisplayItemBadge(recommendation.journalCategoryId, $categoryDropdownData)}
		{/if}
	</div>
	<div class="flex flex-grow"></div>
	<div class="flex w-full flex-row items-stretch gap-2">
		{#if update}
			<Button
				outline
				on:click={update}
				class="flex grow basis-0 flex-row gap-1 align-middle"
				disabled={updateActive}
			>
				{#if updateActive}<Spinner class="flex" size="4" />{:else}<AddIcon class="flex" />{/if}
				<div class="flex">Update And Edit</div>
			</Button>
		{/if}
		{#if updateAndSave}
			<Button
				outline
				on:click={updateAndSave}
				class="grow basis-0  flex-row gap-1 align-middle"
				disabled={updateAndSaveActive}
			>
				{#if updateAndSaveActive}<Spinner class="flex" size="4" />{:else}
					<SaveIcon class="flex" />
				{/if}
				<div class="flex">Update And Save</div>
			</Button>
		{/if}
	</div>
{/snippet}

<Card size="none" class="flex flex-col items-center gap-1">
	{@render displayItem()}
</Card>
