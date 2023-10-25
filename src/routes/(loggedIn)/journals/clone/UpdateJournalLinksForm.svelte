<script lang="ts">
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema';

	import type { SuperForm } from 'sveltekit-superforms/client';

	export let form: SuperForm<UpdateJournalSchemaSuperType>;
	export let hideAccount: boolean = false;

	type DDI = { id: string; title: string; group: string; enabled: boolean };
	type DDINoGroup = { id: string; title: string; enabled: boolean };
	export let dropdownInfo: {
		tags: Promise<DDI[]>;
		bills: Promise<DDINoGroup[]>;
		budgets: Promise<DDINoGroup[]>;
		categories: Promise<DDI[]>;
		accounts: Promise<DDI[]>;
	};

	$: formData = form.form;
</script>

{#if !hideAccount}
	<ComboSelectForm
		{form}
		title="Account"
		items={dropdownInfo.accounts}
		field="accountId"
		placeholder="Select Account..."
		itemToDisplay={(item) => ({ title: item.title, group: item.group })}
		itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
		createField="accountTitle"
		bind:createValue={$formData.accountTitle}
		createDesc="New Expense"
	/>
{/if}
<ComboSelectForm
	{form}
	title="Tag"
	items={dropdownInfo.tags}
	field="tagId"
	clearField="tagClear"
	bind:clearValue={$formData.tagClear}
	placeholder="Select Tag..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="tagTitle"
	bind:createValue={$formData.tagTitle}
	createDesc="New Tag"
/>
<ComboSelectForm
	{form}
	title="Category"
	items={dropdownInfo.categories}
	field="categoryId"
	clearField="categoryClear"
	bind:clearValue={$formData.categoryClear}
	placeholder="Select Category..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="categoryTitle"
	bind:createValue={$formData.categoryTitle}
	createDesc="New Category"
/>
<ComboSelectForm
	{form}
	title="Bill"
	items={dropdownInfo.bills}
	field="billId"
	clearField="billClear"
	bind:clearValue={$formData.billClear}
	placeholder="Select Bill..."
	itemToDisplay={(item) => ({ title: item.title })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="billTitle"
	bind:createValue={$formData.billTitle}
	createDesc="New Bill"
/>
<ComboSelectForm
	{form}
	title="Budget"
	items={dropdownInfo.budgets}
	field="budgetId"
	clearField="budgetClear"
	bind:clearValue={$formData.budgetClear}
	placeholder="Select Budget..."
	itemToDisplay={(item) => ({ title: item.title })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="budgetTitle"
	bind:createValue={$formData.budgetTitle}
	createDesc="New Budget"
/>
