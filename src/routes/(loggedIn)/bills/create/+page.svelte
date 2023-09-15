<script lang="ts">
	import CombinedTitleDisplay from '$lib/components/CombinedTitleDisplay.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { combinedTitleSplitRequired } from '$lib/helpers/combinedTitleSplit.js';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import type { CreateBillSchemaSuperType } from '$lib/schema/billSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<CreateBillSchemaSuperType>(
		data.form
	);
</script>

<PageLayout title="Create Bill" size="xs">
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
