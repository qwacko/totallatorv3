<script lang="ts">
	import CombinedAccountTitleDisplay from '$lib/components/CombinedAccountTitleDisplay.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import type { UpdateAccountSchemaSuperType } from '$lib/schema/accountSchema.js';
	import { Button } from 'flowbite-svelte';
	import DateInput from '$lib/components/DateInput.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import CheckboxInput from '$lib/components/CheckboxInput.svelte';
	import { accountTypeEnumSelection } from '$lib/schema/accountTypeSchema.js';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<UpdateAccountSchemaSuperType>(
		data.form
	);

	$: deleteURL = urlGenerator({
		address: '/(loggedIn)/accounts/[id]/delete',
		paramsValue: { id: data.account.id }
	}).url;

	$: showExtended = $form.type === 'asset' || $form.type === 'liability';
</script>

<CustomHeader pageTitle="Edit Account" filterText={data.account.title} />

<PageLayout title={data.account.title} size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<input type="hidden" name="id" value={data.account.id} />
		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
		/>
		<SelectInput
			items={accountTypeEnumSelection}
			bind:value={$form.type}
			errorMessage={$errors.type}
			name="type"
			title="Type"
		/>
		{#if showExtended}
			<TextInput
				title="Account Group Combined"
				errorMessage={$errors.accountGroupCombined}
				name="accountGroupCombined"
				bind:value={$form.accountGroupCombined}
				{...$constraints.accountGroupCombined}
			/>
			<CombinedAccountTitleDisplay
				title={$form.title || ''}
				accountGroupCombined={$form.accountGroupCombined || ''}
			/>
		{/if}
		<SelectInput
			items={statusEnumSelectionWithoutDeleted}
			bind:value={$form.status}
			errorMessage={$errors.status}
			name="status"
			title="Status"
		/>

		{#if showExtended}
			<div class="grid grid-cols-2 gap-2">
				<CheckboxInput
					bind:value={$form.isCash}
					displayText="Is Cash"
					errorMessage={$errors.isCash}
					name="isCash"
					{...$constraints.isCash}
				/>
				<CheckboxInput
					bind:value={$form.isNetWorth}
					displayText="Is Net Worth"
					errorMessage={$errors.isNetWorth}
					name="isNetWorth"
					{...$constraints.isNetWorth}
				/>
			</div>
			<div class="grid grid-cols-2 gap-2">
				<DateInput
					bind:value={$form.startDate}
					class="flex flex-grow"
					title="Start Date"
					errorMessage={$errors.startDate}
					name="startDate"
					{...$constraints.startDate}
				/>
				<DateInput
					bind:value={$form.endDate}
					title="End Date"
					errorMessage={$errors.endDate}
					name="endDate"
					{...$constraints.startDate}
				/>
			</div>
		{/if}

		<Button type="submit">Update</Button>
		<ErrorText message={$message} />
	</form>

	<PrevPageButton outline>Cancel</PrevPageButton>
	<Button outline color="red" href={deleteURL}>Delete</Button>
</PageLayout>
