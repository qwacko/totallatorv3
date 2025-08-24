<script lang="ts">
	import { Button, Fileupload } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';

	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import {
		accountDropdownData,
		billDropdownData,
		budgetDropdownData,
		categoryDropdownData,
		labelDropdownData,
		tagDropdownData
	} from '$lib/stores/dropdownStores.js';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers.js';

	const { data } = $props();

	let loading = $state(false);

	const form = superForm(
		data.form,
		superFormNotificationHelper({
			errorMessage: 'Failed to upload file',
			successMessage: 'File Uploaded',
			setLoading: (value) => (loading = value),
			invalidate: true
		})
	);
	const enhance = $derived(form.enhance);
	const message = $derived(form.message);

	type LinkedItemOptions = 'account' | 'label' | 'category' | 'budget' | 'tag' | 'bill' | 'none';
	let linkedItem = $state<LinkedItemOptions>('none');
	const linkedItemDropdownOptions = {
		account: { id: 'account', name: 'Account' },
		label: { id: 'label', name: 'Label' },
		category: { id: 'category', name: 'Category' },
		budget: { id: 'budget', name: 'Budget' },
		tag: { id: 'tag', name: 'Tag' },
		bill: { id: 'bill', name: 'Bill' },
		none: { id: 'none', name: 'None' }
	} satisfies {
		[key in LinkedItemOptions]: {
			id: key;
			name: string;
		};
	};

	export const linkedItemDropdown = Object.values(linkedItemDropdownOptions).map((option) => {
		return {
			name: option.name,
			value: option.id
		};
	});
</script>

<CustomHeader pageTitle="New File" />

<PageLayout title="New File" size="xs">
	<form
		method="POST"
		action="?/addFile"
		use:enhance
		class="flex flex-col gap-2"
		enctype="multipart/form-data"
	>
		<TextInputForm {form} title="Title" field="title" />
		<SelectInput
			items={linkedItemDropdown}
			bind:value={linkedItem}
			errorMessage=""
			title="Link Type"
			name="linkedItem"
			disabled={loading}
		/>
		{#if linkedItem === 'account'}
			<ComboSelectForm
				{form}
				title="Account"
				items={$accountDropdownData}
				field="accountId"
				placeholder="Select Account..."
				itemToDisplay={(item) => ({ title: item.title, group: item.group })}
				itemToOption={(item) => ({
					label: item.title,
					value: item.id,
					disabled: !item.enabled
				})}
			/>
		{:else if linkedItem === 'label'}
			<ComboSelectForm
				{form}
				title="Label"
				items={$labelDropdownData}
				field="labelId"
				placeholder="Select Label..."
				itemToDisplay={(item) => ({ title: item.title })}
				itemToOption={(item) => ({
					label: item.title,
					value: item.id,
					disabled: !item.enabled
				})}
			/>
		{:else if linkedItem === 'category'}
			<ComboSelectForm
				{form}
				title="Category"
				items={$categoryDropdownData}
				field="categoryId"
				placeholder="Select Category..."
				itemToDisplay={(item) => ({ title: item.title, group: item.group })}
				itemToOption={(item) => ({
					label: item.title,
					value: item.id,
					disabled: !item.enabled
				})}
			/>
		{:else if linkedItem === 'budget'}
			<ComboSelectForm
				{form}
				title="Budget"
				items={$budgetDropdownData}
				field="budgetId"
				placeholder="Select Budget..."
				itemToDisplay={(item) => ({ title: item.title })}
				itemToOption={(item) => ({
					label: item.title,
					value: item.id,
					disabled: !item.enabled
				})}
			/>
		{:else if linkedItem === 'tag'}
			<ComboSelectForm
				{form}
				title="Tag"
				items={$tagDropdownData}
				field="tagId"
				placeholder="Select Tag..."
				itemToDisplay={(item) => ({ title: item.title, group: item.group })}
				itemToOption={(item) => ({
					label: item.title,
					value: item.id,
					disabled: !item.enabled
				})}
			/>
		{:else if linkedItem === 'bill'}
			<ComboSelectForm
				{form}
				title="Bill"
				items={$billDropdownData}
				field="billId"
				placeholder="Select Bill..."
				itemToDisplay={(item) => ({ title: item.title })}
				itemToOption={(item) => ({
					label: item.title,
					value: item.id,
					disabled: !item.enabled
				})}
			/>
		{/if}
		<Fileupload name="file" class="flex grow rounded-lg" disabled={loading} />
		<Button type="submit" disabled={loading}>Upload</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
