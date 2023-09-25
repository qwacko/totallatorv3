<script lang="ts">
	import AccountIconAsset from '$lib/components/icons/AccountIconAsset.svelte';
	import AccountIconExpense from '$lib/components/icons/AccountIconExpense.svelte';
	import AccountIconIncome from '$lib/components/icons/AccountIconIncome.svelte';
	import AccountIconLiability from '$lib/components/icons/AccountIconLiability.svelte';
	import type { AccountTypeEnumType } from '$lib/schema/accountTypeSchema';
	import { Badge, Tooltip } from 'flowbite-svelte';

	export let accountInfo: {
		id: string | null;
		type: AccountTypeEnumType | null;
		title: string | null;
		accountGroupCombinedTitle: string | null;
	};
</script>

<Badge class="gap-2">
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
<Tooltip>
	<div class="flex flex-col gap-1">
		<div class="flex">
			{#if accountInfo.type === 'asset'}
				Asset
			{:else if accountInfo.type === 'liability'}
				Liability
			{:else if accountInfo.type === 'income'}
				Income
			{:else}
				Expense
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
	</div>
</Tooltip>
