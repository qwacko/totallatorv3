<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import type { CreateSimpleTransactionSuperType } from '$lib/schema/journalSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } =
		superForm<CreateSimpleTransactionSuperType>(data.form);
</script>

<CustomHeader pageTitle="Create Transaction" />

<PageLayout title="Create Transaction" size="lg">
	<form method="POST" use:enhance class="flex flex-col gap-2">
		<TextInput
			title="Description"
			errorMessage={$errors.description}
			name="title"
			bind:value={$form.description}
			{...$constraints.description}
		/>
		<Button type="submit">Create Transaction</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
