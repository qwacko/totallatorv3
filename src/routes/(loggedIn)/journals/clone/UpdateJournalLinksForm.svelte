<script lang="ts">
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema';

	import type { SuperForm } from 'sveltekit-superforms/client';

	export let form: SuperForm<UpdateJournalSchemaSuperType>;

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

<ComboSelectForm
	{form}
	title="Account"
	items={dropdownInfo.accounts}
	field="accountId"
	placeholder="Select Account..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
/>
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
/>
