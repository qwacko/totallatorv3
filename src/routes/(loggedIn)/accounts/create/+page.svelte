<script lang="ts">
	import { page } from '$app/stores';
	import CombinedAccountTitleDisplay from '$lib/components/CombinedAccountTitleDisplay.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { pageInfo } from '$lib/routes';
	import type { CreateAccountSchemaSuperType } from '$lib/schema/accountSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, errors, constraints, message, enhance } = superForm<CreateAccountSchemaSuperType>(
		data.form
	);

	$: urlInfo = pageInfo('/(loggedIn)/accounts/create', $page);
</script>

<CustomHeader pageTitle="New Account" />

<PageLayout title="Create Account" size="xs">
	<form method="POST" use:enhance class="flex flex-col gap-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
		/>
		<TextInput
			title="Account Group Combined"
			errorMessage={$errors.accountGroupCombined}
			name="accountGroupCombined"
			bind:value={$form.accountGroupCombined}
			{...$constraints.accountGroupCombined}
		/>
		<CombinedAccountTitleDisplay
			title={$form.title}
			accountGroupCombined={$form.accountGroupCombined}
		/>
		<Button type="submit">Create</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
