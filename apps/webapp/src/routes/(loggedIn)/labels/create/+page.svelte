<script lang="ts">
  import { Button } from "flowbite-svelte";
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

  const urlInfo = $derived(pageInfo("/(loggedIn)/labels/create", $page));
</script>

<CustomHeader pageTitle="New Label" />

<PageLayout title="Create Label" size="xs">
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
    <Button type="submit">Create</Button>
    <ErrorText message={$message} />
  </form>
</PageLayout>
