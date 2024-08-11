<script lang="ts">
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import type { CreateSimpleTransactionType } from '$lib/schema/journalSchema';
	import {
		accountDropdownData,
		tagDropdownData,
		billDropdownData,
		budgetDropdownData,
		categoryDropdownData
	} from '$lib/stores/dropdownStores.svelte.js';

	import type { SuperForm } from 'sveltekit-superforms';

	const { form }: { form: SuperForm<CreateSimpleTransactionType> } = $props();

	const formData = form.form;
</script>

<ComboSelectForm
	{form}
	title="From Account"
	items={accountDropdownData.value}
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
	items={accountDropdownData.value}
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
	items={tagDropdownData.value}
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
	items={categoryDropdownData.value}
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
	items={billDropdownData.value}
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
	items={budgetDropdownData.value}
	field="budgetId"
	placeholder="Select Budget..."
	itemToDisplay={(item) => ({ title: item.title })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
	createField="budgetTitle"
	bind:createValue={$formData.budgetTitle}
/>
