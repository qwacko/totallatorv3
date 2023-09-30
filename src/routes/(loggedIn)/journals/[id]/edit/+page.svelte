<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema.js';
	import { Badge, Button, Heading } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import ComboSelect from '$lib/components/ComboSelect.svelte';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<UpdateJournalSchemaSuperType>(
		data.journalForm
	);
</script>

<PageLayout size="sm" title="Update Journal">
	{#if data.journal.complete}
		<Badge>Journal Complete - No Update Possible</Badge>
	{:else}
		<form use:enhance method="post" action="?/update" class="flex flex-col gap-2">
			<PreviousUrlInput defaultURL="/journals" />
			{#await data.dropdownInfo.accounts then accountsDropdown}
				<ComboSelect
					items={accountsDropdown}
					placeholder="Select Account..."
					title="Account"
					itemToDisplay={(item) => ({ title: item.title, group: item.group })}
					itemToOption={(item) => ({ label: item.title, value: item.id, disabled: !item.enabled })}
				/>
			{/await}
			<TextInput
				title="Description"
				errorMessage={$errors.description}
				name="description"
				bind:value={$form.description}
				{...$constraints.description}
			/>

			<Button type="submit">Update</Button>
		</form>
	{/if}
	<Heading tag="h2">Form Info</Heading>
	<pre>{JSON.stringify(data.journalForm, null, 2)}</pre>
	<Heading tag="h2">Debug</Heading>
	<pre>{JSON.stringify(data.journal, null, 2)}</pre>
</PageLayout>
