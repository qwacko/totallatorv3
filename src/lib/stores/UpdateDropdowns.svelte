<script lang="ts">
	import {
		tagDropdownTime,
		tagDropdownData,
		accountDropdownTime,
		accountDropdownData,
		billDropdownTime,
		billDropdownData,
		budgetDropdownTime,
		budgetDropdownData,
		categoryDropdownTime,
		categoryDropdownData,
		labelDropdownTime,
		labelDropdownData,
        importMappingDropdownTime,
        importMappingDropdownData,
	} from './dropdownStores.js';

	export let dataUpdated: {
		tags: number;
		bills: number;
		budgets: number;
		categories: number;
		accounts: number;
		labels: number;
        importMappings: number;
	};

	$: $tagDropdownTime = dataUpdated.tags;
    $: $accountDropdownTime = dataUpdated.accounts;
    $: $billDropdownTime = dataUpdated.bills;
    $: $budgetDropdownTime = dataUpdated.budgets;
    $: $categoryDropdownTime = dataUpdated.categories;
    $: $labelDropdownTime = dataUpdated.labels;
    $: $importMappingDropdownTime = dataUpdated.importMappings;
</script>

<div class="hidden">
    {$tagDropdownData}
    {$accountDropdownData}
    {$billDropdownData}
    {$budgetDropdownData}
    {$categoryDropdownData}
    {$labelDropdownData}
    {$importMappingDropdownData}
</div>

