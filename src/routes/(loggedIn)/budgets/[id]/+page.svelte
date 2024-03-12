<script lang="ts">
	import CombinedTitleDisplay from '$lib/components/CombinedTitleDisplay.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { page } from '$app/stores';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm(
		data.form
	);
	$: urlInfo = pageInfo('/(loggedIn)/budgets/[id]', $page);
	$: deleteURL = urlGenerator({
		address: '/(loggedIn)/budgets/[id]/delete',
		paramsValue: { id: data.budget.id }
	}).url;
</script>

<CustomHeader pageTitle="Edit Budget" filterText={data.budget.title} />

<PageLayout title={data.budget.title} size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<input type="hidden" name="id" value={data.budget.id} />
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
		/>
		<CombinedTitleDisplay title={$form.title} />
		<SelectInput
			items={statusEnumSelectionWithoutDeleted}
			bind:value={$form.status}
			errorMessage={$errors.status}
			name="status"
			title="Status"
		/>

		<Button type="submit">Update</Button>
		<ErrorText message={$message} />
	</form>

	<PrevPageButton outline>Cancel</PrevPageButton>
	<Button outline color="red" href={deleteURL}>Delete</Button>
</PageLayout>
