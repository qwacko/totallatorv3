<script lang="ts">
	import { page } from '$app/stores';
	import CombinedAccountTitleDisplay from '$lib/components/CombinedAccountTitleDisplay.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { pageInfo } from '$lib/routes';
	import type { CreateAccountSchemaSuperType } from '$lib/schema/accountSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import { accountTypeEnumSelection } from '$lib/schema/accountTypeSchema.js';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import CheckboxInput from '$lib/components/CheckboxInput.svelte';

	export let data;

	const form = superForm<CreateAccountSchemaSuperType>(data.form);

	$: urlInfo = pageInfo('/(loggedIn)/accounts/create', $page);
	$: formData = form.form;
	$: formErrors = form.errors;
	$: enhance = form.enhance;
	$: constraints = form.constraints;
	$: message = form.message;
</script>

<CustomHeader pageTitle="New Account" />

<PageLayout title="Create Account" size="lg">
	<form method="POST" use:enhance class="grid gap-2 grid-cols-1 md:grid-cols-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInput
			title="Title"
			errorMessage={$formErrors.title}
			name="title"
			bind:value={$formData.title}
			{...$constraints.title}
		/>
		<SelectInput
			items={accountTypeEnumSelection}
			bind:value={$formData.type}
			errorMessage={$formErrors.type}
			name="type"
			title="Type"
			wrapperClass="flex-grow"
		/>
		{#if $formData.type === 'asset' || $formData.type === 'liability' || $formData.type === undefined}
			<TextInput
				title="Account Group Combined"
				errorMessage={$formErrors.accountGroupCombined}
				name="accountGroupCombined"
				bind:value={$formData.accountGroupCombined}
				{...$constraints.accountGroupCombined}
			/>
			<CombinedAccountTitleDisplay
				title={$formData.title}
				accountGroupCombined={$formData.accountGroupCombined}
			/>
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
		<Button type="submit" class="col-span-1 md:col-span-2">Create</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
