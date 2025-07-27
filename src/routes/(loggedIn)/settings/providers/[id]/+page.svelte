<script lang="ts">
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { Button, ButtonGroup } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { page } from '$app/stores';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	const { data } = $props();

	const { form, errors, constraints, message, enhance } = superForm(data.form);

	const urlInfo = $derived(pageInfo('/(loggedIn)/settings/providers/[id]', $page));

	const deleteURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/settings/providers/[id]/delete',
			paramsValue: { id: data.provider.id }
		}).url
	);

	const testConnectionURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/settings/providers/[id]',
			paramsValue: { id: data.provider.id }
		}).url
	);

	const logsURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/settings/providers/logs',
			searchParamsValue: { page: 0, pageSize: 20, llmSettingsId: data.provider.id }
		}).url
	);
</script>

<CustomHeader pageTitle="Edit LLM Provider" filterText={data.provider.title} />

<PageLayout title={data.provider.title} size="sm">
	<form method="POST" class="flex flex-col gap-4" use:enhance>
		<input type="hidden" name="id" value={data.provider.id} />
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
			title="API URL"
			errorMessage={$errors.apiUrl}
			name="apiUrl"
			bind:value={$form.apiUrl}
			{...$constraints.apiUrl}
		/>

		<TextInput
			title="Default Model"
			errorMessage={$errors.defaultModel}
			name="defaultModel"
			bind:value={$form.defaultModel}
			{...$constraints.defaultModel}
		/>

		<TextInput
			title="API Key (leave blank to keep current)"
			errorMessage={$errors.apiKey}
			name="apiKey"
			type="password"
			bind:value={$form.apiKey}
			placeholder="Enter new API key or leave blank to keep current"
		/>

		<ButtonGroup class="flex flex-row">
			<Button
				class="grow basis-0 flex-row gap-2"
				disabled={$form.enabled === true}
				onclick={() => ($form.enabled = true)}
			>
				Enabled
			</Button>
			<Button
				class="grow basis-0 flex-row gap-2"
				disabled={$form.enabled === false}
				onclick={() => ($form.enabled = false)}
			>
				Disabledd
			</Button>
		</ButtonGroup>
		<input type="hidden" id="enabled" name="enabled" value={$form.enabled} />

		<Button type="submit">Update LLM Provider</Button>
		<ErrorText message={$message} />
	</form>

	<div class="mt-6 flex flex-col gap-2">
		<PrevPageButton outline>Cancel</PrevPageButton>
		<Button outline color="blue" href={logsURL}>View Logs for this Provider</Button>
		<Button outline color="green" href={testConnectionURL}>Test Connection</Button>
		<Button outline color="red" href={deleteURL}>Delete</Button>
	</div>
</PageLayout>
