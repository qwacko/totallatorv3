<script lang="ts">
	import { Button, ButtonGroup, Helper, Select } from 'flowbite-svelte';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';

	const { data } = $props();

	const { form, errors, constraints, message, enhance } = superForm(data.form);

	const urlInfo = pageInfo('/(loggedIn)/llm/providers/[id]', () => page);

	// Provider configuration
	const predefinedProviders = data.predefinedProviders;

	// Track selected provider type - initialize with current provider
	let selectedProvider = $state($form.apiUrl || predefinedProviders[0]?.id || 'openai');

	// When provider changes, update form values
	$effect(() => {
		selectedProvider;
		untrack(() => {
			const provider = predefinedProviders.find((p) => p.id === selectedProvider);
			if (provider) {
				$form.apiUrl = provider.id; // Store the provider ID, not the full URL
				// Only update default model if it's empty to preserve user's selection
				if (!$form.defaultModel) {
					$form.defaultModel = provider.defaultModels[0] || '';
				}
			}
		});
	});

	// Provider options for dropdown
	const providerOptions = predefinedProviders.map((p) => ({
		value: p.id,
		name: `${p.name} - ${p.description}`
	}));

	// Get suggested models for selected provider
	const suggestedModels = $derived.by(() => {
		const provider = predefinedProviders.find((p: any) => p.id === selectedProvider);
		return provider?.defaultModels || [];
	});

	const deleteURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/llm/providers/[id]/delete',
			paramsValue: { id: data.provider.id }
		}).url
	);

	const testConnectionURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/llm/providers/[id]',
			paramsValue: { id: data.provider.id }
		}).url
	);

	const logsURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/llm/logs',
			searchParamsValue: {
				page: 0,
				pageSize: 20,
				llmSettingsId: data.provider.id
			}
		}).url
	);
</script>

<CustomHeader pageTitle="Edit LLM Provider" filterText={data.provider.title} />

<PageLayout title={data.provider.title} size="sm">
	<form method="POST" class="flex flex-col gap-4" use:enhance>
		<input type="hidden" name="id" value={data.provider.id} />
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="currentPage" value={urlInfo.updateParamsURLGenerator({}).url} />

		<TextInput
			title="Title"
			errorMessage={$errors.title}
			name="title"
			bind:value={$form.title}
			{...$constraints.title}
		/>

		<div>
			<label
				for="provider-select"
				class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
			>
				Provider Type
			</label>
			<Select
				id="provider-select"
				bind:value={selectedProvider}
				items={providerOptions}
				placeholder="Choose a provider..."
			/>
			<Helper class="mt-1 text-sm text-gray-500">
				Select from officially supported AI SDK providers
			</Helper>
		</div>

		<input type="hidden" name="apiUrl" bind:value={$form.apiUrl} />
		<div>
			<div class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">API Endpoint</div>
			<div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-700">
				{predefinedProviders.find((p) => p.id === selectedProvider)?.apiUrl ||
					'No endpoint selected'}
			</div>
		</div>

		<div>
			<TextInput
				title="Default Model"
				errorMessage={$errors.defaultModel}
				name="defaultModel"
				bind:value={$form.defaultModel}
				placeholder="Select from suggestions below"
				{...$constraints.defaultModel}
			/>
			{#if suggestedModels.length > 0}
				<Helper class="mt-1 text-sm text-gray-500">
					Suggested models:
					{#each suggestedModels as model, i}
						<button
							type="button"
							class="text-blue-600 hover:underline"
							onclick={() => ($form.defaultModel = String(model))}
						>
							{model}
						</button>
						{#if i < suggestedModels.length - 1},
						{/if}
					{/each}
				</Helper>
			{/if}
		</div>

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
				Disabled
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
