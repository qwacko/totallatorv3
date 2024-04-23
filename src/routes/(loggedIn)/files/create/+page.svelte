<script lang="ts">
	import ComboSelectForm from '$lib/components/ComboSelectForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import { Button, Fileupload } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { superFormNotificationHelper } from '$lib/stores/notificationHelpers.js';

	export let data;

	let loading = false;

	const form = superForm(
		data.form,
		superFormNotificationHelper({
			errorMessage: 'Failed to upload file',
			successMessage: 'File Uploaded',
			setLoading: (value) => (loading = value),
			invalidate: true
		})
	);
	$: enhance = form.enhance;
	$: message = form.message;

	type LinkedItemOptions = 'account' | 'label' | 'category' | 'budget' | 'tag' | 'bill' | 'none';
	let linkedItem: LinkedItemOptions = 'none';
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
			{#await data.dropdownInfo.account then dropdownInfo}
				<ComboSelectForm
					{form}
					title="Account"
					items={dropdownInfo}
					field="accountId"
					placeholder="Select Account..."
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
				/>
			{/await}
        {:else if linkedItem === 'label'}
            {#await data.dropdownInfo.label then dropdownInfo}
                <ComboSelectForm
                    {form}
                    title="Label"
                    items={dropdownInfo}
                    field="labelId"
                    placeholder="Select Label..."
                    itemToDisplay={(item) => ({ title: item.title })}
                    itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
                />
            {/await}
        {:else if linkedItem === 'category'}
            {#await data.dropdownInfo.category then dropdownInfo}
                <ComboSelectForm
                    {form}
                    title="Category"
                    items={dropdownInfo}
                    field="categoryId"
                    placeholder="Select Category..."
                    itemToDisplay={(item) => ({ title: item.title, group: item.group })}
                    itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
                />
            {/await}
        {:else if linkedItem === 'budget'}
            {#await data.dropdownInfo.budget then dropdownInfo}
                <ComboSelectForm
                    {form}
                    title="Budget"
                    items={dropdownInfo}
                    field="budgetId"
                    placeholder="Select Budget..."
                    itemToDisplay={(item) => ({ title: item.title })}
                    itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
                />
            {/await}
        {:else if linkedItem === 'tag'}
            {#await data.dropdownInfo.tag then dropdownInfo}
                <ComboSelectForm
                    {form}
                    title="Tag"
                    items={dropdownInfo}
                    field="tagId"
                    placeholder="Select Tag..."
                    itemToDisplay={(item) => ({ title: item.title, group: item.group })}
                    itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
                />
            {/await}
        {:else if linkedItem === 'bill'}
            {#await data.dropdownInfo.bill then dropdownInfo}
                <ComboSelectForm
                    {form}
                    title="Bill"
                    items={dropdownInfo}
                    field="billId"
                    placeholder="Select Bill..."
                    itemToDisplay={(item) => ({ title: item.title })}
                    itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
                />
            {/await}

		{/if}
		<Fileupload name="file" class="flex flex-grow rounded-lg" disabled={loading} />
		<Button type="submit" disabled={loading}>Upload</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
