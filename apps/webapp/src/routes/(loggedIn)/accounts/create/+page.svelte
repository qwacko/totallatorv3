<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';

	import { accountTypeEnumSelection } from '@totallator/shared';

	import { page } from '$app/state';

	import CheckboxInput from '$lib/components/CheckboxInput.svelte';
	import CombinedAccountTitleDisplay from '$lib/components/CombinedAccountTitleDisplay.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { pageInfo } from '$lib/routes';

	const { data } = $props();

	const form = superForm(data.form);

	const urlInfo = pageInfo('/(loggedIn)/accounts/create', () => page);
	const formData = $derived(form.form);
	const formErrors = $derived(form.errors);
	const enhance = $derived(form.enhance);
	const constraints = $derived(form.constraints);
	const message = $derived(form.message);
</script>

<CustomHeader pageTitle="New Account" />

<PageLayout title="Create Account" size="lg">
	<form method="POST" use:enhance class="grid grid-cols-1 gap-2 md:grid-cols-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.updateParamsURLGenerator({}).url} />
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
			wrapperClass="grow"
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
