<script lang="ts">
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import type { CreateSimpleTransactionType } from '$lib/schema/journalSchema';

	import type { SuperForm } from 'sveltekit-superforms';

	export let form: SuperForm<CreateSimpleTransactionType>;

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

<ComboSelectForm
	{form}
	title="From Account"
	items={dropdownInfo.account}
	field="fromAccountId"
	placeholder="Select Account..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="fromAccountTitle"
	bind:createValue={$formData.fromAccountTitle}
/>
<ComboSelectForm
	{form}
	title="To Account"
	items={dropdownInfo.account}
	field="toAccountId"
	placeholder="Select Account..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="toAccountTitle"
	bind:createValue={$formData.toAccountTitle}
/>

<ComboSelectForm
	{form}
	title="Tag"
	items={dropdownInfo.tag}
	field="tagId"
	placeholder="Select Tag..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="tagTitle"
	bind:createValue={$formData.tagTitle}
/>
<ComboSelectForm
	{form}
	title="Category"
	items={dropdownInfo.category}
	field="categoryId"
	placeholder="Select Category..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="categoryTitle"
	bind:createValue={$formData.categoryTitle}
/>
<ComboSelectForm
	{form}
	title="Bill"
	items={dropdownInfo.bill}
	field="billId"
	placeholder="Select Bill..."
	itemToDisplay={(item) => ({ title: item.title })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="billTitle"
	bind:createValue={$formData.billTitle}
/>
<ComboSelectForm
	{form}
	title="Budget"
	items={dropdownInfo.budget}
	field="budgetId"
	placeholder="Select Budget..."
	itemToDisplay={(item) => ({ title: item.title })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="budgetTitle"
	bind:createValue={$formData.budgetTitle}
/>
