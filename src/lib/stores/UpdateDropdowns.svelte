<script lang="ts">
	import { untrack } from 'svelte';
	import {
		tagDropdownData,
		tagDropdownUpdateData,
		accountDropdownData,
		accountDropdownUpdateData,
		billDropdownData,
		billDropdownUpdateData,
		budgetDropdownData,
		budgetDropdownUpdateData,
		categoryDropdownData,
		categoryDropdownUpdateData,
		labelDropdownData,
		labelDropdownUpdateData,
		importMappingDropdownData,
		importMappingDropdownUpdateData
	} from './dropdownStores.svelte.js';

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
		untrack(() => tagDropdownUpdateData)(dataUpdated.tags);
	});
	$effect(() => {
		untrack(() => accountDropdownUpdateData)(dataUpdated.accounts);
	});
	$effect(() => {
		untrack(() => billDropdownUpdateData)(dataUpdated.bills);
	});
	$effect(() => {
		untrack(() => budgetDropdownUpdateData)(dataUpdated.budgets);
	});
	$effect(() => {
		untrack(() => categoryDropdownUpdateData)(dataUpdated.categories);
	});
	$effect(() => {
		untrack(() => labelDropdownUpdateData)(dataUpdated.labels);
	});
	$effect(() => {
		untrack(() => importMappingDropdownUpdateData)(dataUpdated.importMappings);
	});
</script>

<div class="hidden">
	{tagDropdownData.value}
	{accountDropdownData.value}
	{billDropdownData.value}
	{budgetDropdownData.value}
	{categoryDropdownData.value}
	{labelDropdownData.value}
	{importMappingDropdownData.value}
</div>
