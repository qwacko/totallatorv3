<script lang="ts">
	import CombinedTitleDisplay from '$lib/components/CombinedTitleDisplay.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import type { CreateTagSchemaSuperType } from '$lib/schema/tagSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<CreateTagSchemaSuperType>(
		data.form
	);
</script>

<CustomHeader pageTitle="New Tag" />

<PageLayout title="Create Tag" size="xs">
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
