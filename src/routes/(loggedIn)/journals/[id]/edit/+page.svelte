<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema.js';
	import { Badge, Button, Heading } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import ComboSelect from '$lib/components/ComboSelect.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import DateInput from '$lib/components/DateInput.svelte';
	import CurrencyInput from '$lib/components/CurrencyInput.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<UpdateJournalSchemaSuperType>(
		data.journalForm
	);
</script>

<PageLayout size="sm" title="Update Journal">
	{#if data.journal.complete}
		<Badge>Journal Complete - No Update Possible</Badge>
	{:else}
		<form use:enhance method="post" action="?/update" class="flex flex-col gap-4">
			<PreviousUrlInput defaultURL="/journals" />
			<DateInput
				title="Date"
				name="date"
				bind:value={$form.date}
				{...$constraints.date}
				errorMessage={$errors.date}
				clearable={false}
			/>
			<TextInput
				title="Description"
				errorMessage={$errors.description}
				name="description"
				bind:value={$form.description}
				{...$constraints.description}
			/>
			<CurrencyInput
				title="Amount"
				errorMessage={$errors.amount}
				name="amount"
				bind:value={$form.amount}
				step={0.01}
			/>
			{#await data.dropdownInfo.accounts then accountsDropdown}
				<ComboSelect
					name="accountId"
					bind:value={$form.accountId}
					items={accountsDropdown}
					placeholder="Select Account..."
					title="Account"
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
				/>
				{#if $form.otherAccountId}
					<ComboSelect
						name="otherAccountId"
						bind:value={$form.otherAccountId}
						items={accountsDropdown}
						placeholder="Select Account..."
						title="Payee"
						itemToDisplay={(item) => ({ title: item.title, group: item.group })}
						itemToOption={(item) => ({
							label: item.title,
							value: item.id,
							disabled: !item.enabled
						})}
					/>
				{/if}
			{/await}
			{#await data.dropdownInfo.tags then tagsDropdown}
				<ComboSelect
					name="tagId"
					bind:value={$form.tagId}
					bind:clearValue={$form.tagClear}
					clearable
					items={tagsDropdown}
					placeholder="Select Tag..."
					title="Tag"
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
				/>
			{/await}

			{#await data.dropdownInfo.categories then categoriesDropdown}
				<ComboSelect
					name="categoryId"
					bind:value={$form.categoryId}
					bind:clearValue={$form.categoryClear}
					clearable
					items={categoriesDropdown}
					placeholder="Select Category..."
					title="Category"
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
				/>
			{/await}

			{#await data.dropdownInfo.bills then billsDropdown}
				<ComboSelect
					name="billId"
					bind:value={$form.billId}
					bind:clearValue={$form.billClear}
					clearable
					items={billsDropdown}
					placeholder="Select Bill..."
					title="Bill"
					itemToDisplay={(item) => ({ title: item.title })}
					itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
				/>
			{/await}

			{#await data.dropdownInfo.budgets then budgetsDropdown}
				<ComboSelect
					name="budgetId"
					bind:value={$form.budgetId}
					bind:clearValue={$form.budgetClear}
					clearable
					items={budgetsDropdown}
					placeholder="Select Budget..."
					title="Budget"
					itemToDisplay={(item) => ({ title: item.title })}
					itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
				/>
			{/await}
			<ErrorText message={$message} />
			<Button type="submit">Update</Button>
		</form>
	{/if}
	<RawDataModal data={{ form: $form, data: data }} title="Page Date" dev={data.dev} />
</PageLayout>
