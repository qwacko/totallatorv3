<script lang="ts">
  import { Button, Helper, Select, Toggle } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";

  import { page } from "$app/stores";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import ErrorText from "$lib/components/ErrorText.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import PreviousUrlInput from "$lib/components/PreviousURLInput.svelte";
  import TextInput from "$lib/components/TextInput.svelte";
  import { pageInfo } from "$lib/routes";

  const { data } = $props();

  const { form, errors, constraints, message, enhance } = superForm(data.form);
  const urlInfo = $derived(pageInfo("/(loggedIn)/llm/providers/create", $page));

  // Provider configuration
  const predefinedProviders = data.predefinedProviders;

  // Track selected provider type
  let selectedProvider = $state(predefinedProviders[0]?.id || "openai");

  // When provider changes, update form values
  $effect(() => {
    const provider = predefinedProviders.find((p) => p.id === selectedProvider);
    if (provider) {
      $form.apiUrl = provider.id; // Store the provider ID, not the full URL
      $form.defaultModel = provider.defaultModels[0] || "";
    }
  });

  // Provider options for dropdown
  const providerOptions = predefinedProviders.map((p) => ({
    value: p.id,
    name: `${p.name} - ${p.description}`,
  }));

  // Get suggested models for selected provider
  const suggestedModels = $derived.by(() => {
    const provider = predefinedProviders.find(
      (p: any) => p.id === selectedProvider,
    );
    return provider?.defaultModels || [];
  });
</script>

<CustomHeader pageTitle="Create LLM Provider" />

<PageLayout title="Create LLM Provider" size="sm">
  <form method="POST" use:enhance class="flex flex-col gap-4">
    <PreviousUrlInput name="prevPage" />
    <input type="hidden" name="currentPage" value={urlInfo.current.url} />

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

    <TextInput
      title="Title"
      errorMessage={$errors.title}
      name="title"
      bind:value={$form.title}
      placeholder={`e.g., ${predefinedProviders.find((p) => p.id === selectedProvider)?.name || "Provider"} Production`}
      {...$constraints.title}
    />

    <input type="hidden" name="apiUrl" bind:value={$form.apiUrl} />
    <div>
      <div class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
        API Endpoint
      </div>
      <div
        class="rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-700"
      >
        {predefinedProviders.find((p) => p.id === selectedProvider)?.apiUrl ||
          "No endpoint selected"}
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
