<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";

  import { statusEnumSelectionWithoutDeleted } from "@totallator/shared";

  import { page } from "$app/stores";

  import CombinedTitleDisplay from "$lib/components/CombinedTitleDisplay.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import ErrorText from "$lib/components/ErrorText.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import PreviousUrlInput from "$lib/components/PreviousURLInput.svelte";
  import SelectInput from "$lib/components/SelectInput.svelte";
  import TextInput from "$lib/components/TextInput.svelte";
  import { pageInfo } from "$lib/routes";

  const { data } = $props();

  const { form, errors, constraints, message, enhance } = superForm(data.form);

  const urlInfo = $derived(pageInfo("/(loggedIn)/tags/create", $page));
</script>

<CustomHeader pageTitle="New Tag" />

<PageLayout title="Create Tag" size="xs">
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
    <CombinedTitleDisplay title={$form.title} />
    <SelectInput
      items={statusEnumSelectionWithoutDeleted}
      bind:value={$form.status}
      errorMessage={$errors.status}
      name="status"
      title="Status"
    />
    <Button type="submit">Create</Button>
    <ErrorText message={$message} />
  </form>
</PageLayout>
