<script lang="ts">
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import type { UpdateJournalSchemaType } from '$lib/schema/journalSchema';

	import type { SuperForm } from 'sveltekit-superforms';

	export let form: SuperForm<UpdateJournalSchemaType>;
	export let hideAccount: boolean = false;

	type DDI = { id: string; title: string; group: string; enabled: boolean };
	type DDINoGroup = { id: string; title: string; enabled: boolean };
	export let dropdownInfo: {
		tag: Promise<DDI[]>;
		bill: Promise<DDINoGroup[]>;
		budget: Promise<DDINoGroup[]>;
		category: Promise<DDI[]>;
		account: Promise<DDI[]>;
	};

	$: formData = form.form;
</script>

{#if !hideAccount}
	<ComboSelectForm
		{form}
		title="Account"
		items={dropdownInfo.account}
		field="accountId"
		placeholder="Select Account..."
		itemToDisplay={(item) => ({ title: item.title, group: item.group })}
		itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
		createField="accountTitle"
		bind:createValue={$formData.accountTitle}
		createDesc="New Expense"
	/>
	<ComboSelectForm
		{form}
		title="Payee"
		items={dropdownInfo.account}
		field="otherAccountId"
		placeholder="Select Payee..."
		itemToDisplay={(item) => ({ title: item.title, group: item.group })}
		itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
		createField="otherAccountTitle"
		bind:createValue={$formData.otherAccountTitle}
		createDesc="New Expense"
	/>
{/if}
<ComboSelectForm
	{form}
	title="Tag"
	items={dropdownInfo.tag}
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
	items={dropdownInfo.category}
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
	items={dropdownInfo.bill}
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
	items={dropdownInfo.budget}
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
