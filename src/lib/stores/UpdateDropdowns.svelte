<script lang="ts">
	import {
		tagDropdownTime,
		tagDropdownData,
		tagDropdownAsyncData,
		accountDropdownTime,
		accountDropdownData,
		accountDropdownAsyncData,
		billDropdownTime,
		billDropdownData,
		billDropdownAsyncData,
		budgetDropdownTime,
		budgetDropdownData,
		budgetDropdownAsyncData,
		categoryDropdownTime,
		categoryDropdownData,
		categoryDropdownAsyncData,
		labelDropdownTime,
		labelDropdownData,
		labelDropdownAsyncData,
		importMappingDropdownTime,
		importMappingDropdownData,
		importMappingDropdownAsyncData
	} from './dropdownStores.js';

	const {dataUpdated} : { dataUpdated: {
		tags: number;
		bills: number;
		budgets: number;
		categories: number;
		accounts: number;
		labels: number;
		importMappings: number;
	}} = $props();

	$effect(() => {$tagDropdownTime = dataUpdated.tags});
	$effect(() => {$accountDropdownTime = dataUpdated.accounts});
	$effect(() => {$billDropdownTime = dataUpdated.bills});
	$effect(() => { $budgetDropdownTime = dataUpdated.budgets});
	$effect(() => {$categoryDropdownTime = dataUpdated.categories});
	$effect(() => { $labelDropdownTime = dataUpdated.labels});
	$effect(() => { $importMappingDropdownTime = dataUpdated.importMappings});
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
