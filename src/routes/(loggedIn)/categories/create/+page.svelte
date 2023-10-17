<script lang="ts">
	import CombinedTitleDisplay from '$lib/components/CombinedTitleDisplay.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import type { CreateCategorySchemaSuperType } from '$lib/schema/categorySchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import CustomHeader from '$lib/components/CustomHeader.svelte';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<CreateCategorySchemaSuperType>(
		data.form
	);
</script>

<CustomHeader pageTitle="New Category" />

<PageLayout title="Create Category" size="xs">
	<form method="POST" use:enhance class="flex flex-col gap-2">
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
		<Button type="submit">Create</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
