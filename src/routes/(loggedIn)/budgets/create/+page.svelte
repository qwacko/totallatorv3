<script lang="ts">
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import type { CreateBudgetSchemaSuperType } from '$lib/schema/budgetSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<CreateBudgetSchemaSuperType>(
		data.form
	);
</script>

<PageLayout title="Create Budget" size="xs">
	<form method="POST" use:enhance class="flex flex-col gap-2">
		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
		/>
		<Button type="submit">Create</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
