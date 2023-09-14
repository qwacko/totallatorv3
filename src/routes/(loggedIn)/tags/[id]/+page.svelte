<script lang="ts">
	import { page } from '$app/stores';
	import CombinedTitleDisplay from '$lib/components/CombinedTitleDisplay.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { combinedTitleSplitRequired } from '$lib/helpers/combinedTitleSplit.js';
	import { urlGenerator } from '$lib/routes.js';
	import { statusEnumSelectionWithoutDeleted } from '$lib/schema/statusSchema.js';
	import type { UpdateTagSchemaSuperType } from '$lib/schema/tagSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<UpdateTagSchemaSuperType>(
		data.form
	);

	$: deleteURL = urlGenerator({
		address: '/(loggedIn)/tags/[id]/delete',
		paramsValue: { id: data.tag.id },
		searchParamsValue: { return: $page.url.toString() }
	}).url;
</script>

<PageLayout title={data.tag.title} size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<input type="hidden" name="id" value={data.tag.id} />
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

	<Button outline color="red" href={deleteURL}>Delete</Button>
</PageLayout>
