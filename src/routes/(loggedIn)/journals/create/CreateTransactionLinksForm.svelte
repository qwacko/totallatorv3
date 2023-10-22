<script lang="ts">
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import type { CreateSimpleTransactionSuperType } from '$lib/schema/journalSchema';

	import type { SuperForm } from 'sveltekit-superforms/client';

	export let form: SuperForm<CreateSimpleTransactionSuperType>;

	type DDI = { id: string; title: string; group: string; enabled: boolean };
	type DDINoGroup = { id: string; title: string; enabled: boolean };
	export let dropdownInfo: {
		tags: Promise<DDI[]>;
		bills: Promise<DDINoGroup[]>;
		budgets: Promise<DDINoGroup[]>;
		categories: Promise<DDI[]>;
		accounts: Promise<DDI[]>;
	};
</script>

<ComboSelectForm
	{form}
	title="From Account"
	items={dropdownInfo.accounts}
	field="fromAccountId"
	placeholder="Select Account..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
/>
<ComboSelectForm
	{form}
	title="to Account"
	items={dropdownInfo.accounts}
	field="toAccountId"
	placeholder="Select Account..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
/>

<ComboSelectForm
	{form}
	title="Tag"
	items={dropdownInfo.tags}
	field="tagId"
	placeholder="Select Tag..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
/>
<ComboSelectForm
	{form}
	title="Category"
	items={dropdownInfo.categories}
	field="categoryId"
	placeholder="Select Category..."
	itemToDisplay={(item) => ({ title: item.title, group: item.group })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
/>
<ComboSelectForm
	{form}
	title="Bill"
	items={dropdownInfo.bills}
	field="billId"
	placeholder="Select Bill..."
	itemToDisplay={(item) => ({ title: item.title })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
/>
<ComboSelectForm
	{form}
	title="Budget"
	items={dropdownInfo.budgets}
	field="budgetId"
	placeholder="Select Budget..."
	itemToDisplay={(item) => ({ title: item.title })}
	itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
/>
