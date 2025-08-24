<script lang="ts">
	import {
		accountDropdownAsyncData,
		accountDropdownData,
		accountDropdownTime,
		billDropdownAsyncData,
		billDropdownData,
		billDropdownTime,
		budgetDropdownAsyncData,
		budgetDropdownData,
		budgetDropdownTime,
		categoryDropdownAsyncData,
		categoryDropdownData,
		categoryDropdownTime,
		importMappingDropdownAsyncData,
		importMappingDropdownData,
		importMappingDropdownTime,
		labelDropdownAsyncData,
		labelDropdownData,
		labelDropdownTime,
		tagDropdownAsyncData,
		tagDropdownData,
		tagDropdownTime
	} from './dropdownStores.js';

	const {
		dataUpdated
	}: {
		dataUpdated: {
			tags: number;
			bills: number;
			budgets: number;
			categories: number;
			accounts: number;
			labels: number;
			importMappings: number;
		};
	} = $props();

	$effect(() => {
		$tagDropdownTime = dataUpdated.tags;
	});
	$effect(() => {
		$accountDropdownTime = dataUpdated.accounts;
	});
	$effect(() => {
		$billDropdownTime = dataUpdated.bills;
	});
	$effect(() => {
		$budgetDropdownTime = dataUpdated.budgets;
	});
	$effect(() => {
		$categoryDropdownTime = dataUpdated.categories;
	});
	$effect(() => {
		$labelDropdownTime = dataUpdated.labels;
	});
	$effect(() => {
		$importMappingDropdownTime = dataUpdated.importMappings;
	});
</script>

<div class="hidden">
	{$tagDropdownAsyncData}
	{$accountDropdownAsyncData}
	{$billDropdownAsyncData}
	{$budgetDropdownAsyncData}
	{$categoryDropdownAsyncData}
	{$labelDropdownAsyncData}
	{$importMappingDropdownAsyncData}
	{$tagDropdownData}
	{$accountDropdownData}
	{$billDropdownData}
	{$budgetDropdownData}
	{$categoryDropdownData}
	{$labelDropdownData}
	{$importMappingDropdownData}
</div>
