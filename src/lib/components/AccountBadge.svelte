<script lang="ts">
	import AccountIconAsset from '$lib/components/icons/AccountIconAsset.svelte';
	import AccountIconExpense from '$lib/components/icons/AccountIconExpense.svelte';
	import AccountIconIncome from '$lib/components/icons/AccountIconIncome.svelte';
	import AccountIconLiability from '$lib/components/icons/AccountIconLiability.svelte';
	import { accountTypeEnum, type AccountTypeEnumType } from '$lib/schema/accountTypeSchema';
	import { Badge, Button, Dropdown, Tooltip } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import { defaultJournalFilter, type JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { urlGenerator } from '$lib/routes';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';

	export let accountInfo: {
		id: string | null;
		type: AccountTypeEnumType | null;
		title: string | null;
		accountGroupCombinedTitle: string | null;
	};

	export let currentFilter: JournalFilterSchemaType;
	export let payeeFilter = false;

	let opened = false;

	$: filterURL = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...currentFilter,
			...(payeeFilter
				? { payee: { id: accountInfo.id || undefined } }
				: {
						account: {
							id: accountInfo.id || undefined,
							type: [...accountTypeEnum]
						}
				  })
		}
	}).url;

	$: viewURL = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...defaultJournalFilter,
			...(payeeFilter
				? { payee: { id: accountInfo.id || undefined } }
				: {
						account: {
							id: accountInfo.id || undefined,
							type: [...accountTypeEnum]
						}
				  })
		}
	}).url;
</script>

{#if accountInfo.id && accountInfo.title && accountInfo.type}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		{#if accountInfo.type === 'asset'}
			<AccountIconAsset />
		{:else if accountInfo.type === 'liability'}
			<AccountIconLiability />
		{:else if accountInfo.type === 'income'}
			<AccountIconIncome />
		{:else}
			<AccountIconExpense />
		{/if}
		{accountInfo.title}
	</Badge>
	<Dropdown bind:open={opened} class="p-2 w-52" border>
		<div class="flex flex-col gap-1">
			<div class="flex flex-row items-center gap-2 font-normal italic">
				{#if accountInfo.type === 'asset'}
					<AccountIconAsset /> Asset
				{:else if accountInfo.type === 'liability'}
					<AccountIconLiability /> Liability
				{:else if accountInfo.type === 'income'}
					<AccountIconIncome /> Income
				{:else}
					<AccountIconExpense /> Expense
				{/if}
			</div>
			{#if accountInfo.accountGroupCombinedTitle}
				<div class="flex">
					{accountInfo.accountGroupCombinedTitle}
				</div>
			{/if}
			{#if accountInfo.title}
				<div class="flex">
					{accountInfo.title}
				</div>
			{/if}
			<div class="flex flex-row justify-between">
				<Button href={viewURL} outline color="light" size="xs"><JournalEntryIcon /></Button>
				<Button href={filterURL} outline color="light" size="xs"><FilterIcon /></Button>
			</div>
		</div>
	</Dropdown>
{/if}
