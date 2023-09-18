<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import CombinedTitleDisplay from '$lib/components/CombinedTitleDisplay.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import type { UpdateBudgetSchemaSuperType } from '$lib/schema/budgetSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<UpdateBudgetSchemaSuperType>(
		data.form
	);

	let previousPage: string = '/budgets';

	afterNavigate(({ from }) => {
		previousPage = from?.url.href || previousPage;
	});

	$: deleteURL = urlGenerator({
		address: '/(loggedIn)/budgets/[id]/delete',
		paramsValue: { id: data.budget.id }
	}).url;
</script>

<PageLayout title={data.budget.title} size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<input type="hidden" name="id" value={data.budget.id} />
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

	<Button outline href={previousPage}>Cancel</Button>
	<Button outline color="red" href={deleteURL}>Delete</Button>
</PageLayout>