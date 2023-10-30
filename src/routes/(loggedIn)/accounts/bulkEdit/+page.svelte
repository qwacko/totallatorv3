<script lang="ts">
	import { pageInfo } from '$lib/routes.js';
	import { page } from '$app/stores';
	import { superForm } from 'sveltekit-superforms/client';
	import type { UpdateAccountSchemaSuperType } from '$lib/schema/accountSchema.js';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import FilterTextDisplay from '$lib/components/FilterTextDisplay.svelte';
	import { Button, Heading, Toggle } from 'flowbite-svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { AnyZodObject } from 'zod';
	import CheckboxInput from '$lib/components/CheckboxInput.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import { accountTypeEnumSelection } from '$lib/schema/accountTypeSchema.js';
	import { statusEnumSelection } from '$lib/schema/statusSchema.js';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/accounts/bulkEdit', $page);

	const form = superForm<UpdateAccountSchemaSuperType>(
		data.form as SuperValidated<AnyZodObject, any>,
		{
			taintedMessage: null
		}
	);

	let updateAccountGrouping = false;

	$: titleText = `Update ${data.numberItems} Accounts`;
	$: enhance = form.enhance;
	$: formData = form.form;
	$: formErrors = form.errors;
</script>

<CustomHeader pageTitle={titleText} filterText={data.filterText} />

<PageLayout title={titleText}>
	<FilterTextDisplay text={data.filterText} />
	<Heading tag="h3">Set Journal State</Heading>
	<form method="post" class="grid grid-cols-1 md:grid-cols-2 gap-4" use:enhance>
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />

		{#if $formData.type === 'asset' || $formData.type === 'liability'}
			<Toggle
				class="col-span-1 md:col-span-2"
				checked={updateAccountGrouping === true}
				on:change={(e) => {
					updateAccountGrouping = !updateAccountGrouping;
					form.reset();
				}}
			>
				Update Account Grouping
			</Toggle>
		{/if}
		<TextInputForm {form} field="title" title="Title" />
		<SelectInput
			items={accountTypeEnumSelection}
			bind:value={$formData.type}
			errorMessage={$formErrors.type}
			name="type"
			title="Type"
		/>
		<SelectInput
			items={statusEnumSelection}
			bind:value={$formData.status}
			errorMessage={$formErrors.status}
			name="status"
			title="Status"
		/>
		{#if $formData.type === 'asset' || $formData.type === 'liability'}
			{#if updateAccountGrouping}
				<TextInputForm
					{form}
					field="accountGroupCombined"
					title="Combined Account Grouping"
					clearable
					clearField="accountGroupCombinedClear"
				/>
			{:else}
				<TextInputForm
					{form}
					field="accountGroup"
					title="Account Group"
					clearable
					clearField="accountGroupClear"
				/>
				<TextInputForm
					{form}
					field="accountGroup2"
					title="Account Group 2"
					clearable
					clearField="accountGroup2Clear"
				/>
				<TextInputForm
					{form}
					field="accountGroup3"
					title="Account Group 3"
					clearable
					clearField="accountGroup3Clear"
				/>
			{/if}
			<DateInputForm {form} field="startDate" title="Start Date" />
			<DateInputForm {form} field="endDate" title="End Date" />
			<CheckboxInput name="isCash" bind:value={$formData.isCash} title="Is Cash" errorMessage="" />
			<CheckboxInput
				name="isNetWorth"
				bind:value={$formData.isNetWorth}
				title="Is Net Worth"
				errorMessage=""
			/>
		{/if}
		<Button type="submit" class="col-span-1 md:col-span-2">Update</Button>
		<Button type="button" on:click={() => form.reset()} class="col-span-1 md:col-span-2">
			Reset
		</Button>
	</form>
</PageLayout>
