<script lang="ts">
	import { page } from '$app/stores';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { pageInfo } from '$lib/routes';
	import { Button, Toggle } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';

	const { data } = $props();

	const { form, errors, constraints, message, enhance } = superForm(data.form);
	const urlInfo = $derived(pageInfo('/(loggedIn)/settings/providers/create', $page));
</script>

<CustomHeader pageTitle="Create LLM Provider" />

<PageLayout title="Create LLM Provider" size="sm">
	<form method="POST" use:enhance class="flex flex-col gap-4">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />

		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			placeholder="e.g., OpenAI Production"
			{...$constraints.title}
		/>

		<TextInput
			title="API URL"
			errorMessage={$errors.apiUrl}
			name="apiUrl"
			bind:value={$form.apiUrl}
			placeholder="e.g., https://api.openai.com/v1"
			{...$constraints.apiUrl}
		/>

		<TextInput
			title="Default Model"
			errorMessage={$errors.defaultModel}
			name="defaultModel"
			bind:value={$form.defaultModel}
			placeholder="e.g., gpt-4-turbo"
			{...$constraints.defaultModel}
		/>

		<TextInput
			title="API Key"
			errorMessage={$errors.apiKey}
			name="apiKey"
			type="password"
			bind:value={$form.apiKey}
			placeholder="Enter API key"
			{...$constraints.apiKey}
		/>

		<div class="flex items-center space-x-3">
			<Toggle name="enabled" bind:checked={$form.enabled}>Enabled</Toggle>
		</div>

		<Button type="submit">Create LLM Provider</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
