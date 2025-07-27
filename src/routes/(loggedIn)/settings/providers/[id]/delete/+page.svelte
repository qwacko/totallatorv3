<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import { pageInfo } from '$lib/routes';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { page } from '$app/stores';

	const { data } = $props();

	const { message, enhance } = superForm(data.form);
	const urlInfo = $derived(pageInfo('/(loggedIn)/settings/providers/[id]/delete', $page));

	const formatTimestamp = (timestamp: string | Date) => {
		return new Date(timestamp).toLocaleString();
	};
</script>

<CustomHeader pageTitle="Delete LLM Provider" filterText={data.provider.title} />

<PageLayout title="Delete LLM Provider" size="sm">
	<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
		<h3 class="font-semibold text-red-800 mb-2">⚠️ Warning</h3>
		<p class="text-red-700 mb-4">
			You are about to permanently delete this LLM provider. This action cannot be undone.
		</p>
		
		<div class="bg-white p-3 rounded border">
			<h4 class="font-medium mb-2">Provider Details:</h4>
			<div class="space-y-1 text-sm">
				<div><span class="font-medium">Title:</span> {data.provider.title}</div>
				<div><span class="font-medium">API URL:</span> {data.provider.apiUrl}</div>
				<div><span class="font-medium">Default Model:</span> {data.provider.defaultModel || 'Not set'}</div>
				<div><span class="font-medium">Status:</span> {data.provider.enabled ? 'Enabled' : 'Disabled'}</div>
				<div><span class="font-medium">Created:</span> {formatTimestamp(data.provider.createdAt)}</div>
			</div>
		</div>
	</div>

	<form method="POST" use:enhance class="flex flex-col gap-4">
		<input type="hidden" name="id" value={data.provider.id} />
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />

		<div class="flex gap-2">
			<Button type="submit" color="red">Delete LLM Provider</Button>
			<PrevPageButton outline>Cancel</PrevPageButton>
		</div>
		
		<ErrorText message={$message} />
	</form>
</PageLayout>