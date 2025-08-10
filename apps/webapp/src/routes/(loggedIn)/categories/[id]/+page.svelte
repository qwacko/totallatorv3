<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";

  import { statusEnumSelectionWithoutDeleted } from "@totallator/shared";

  import { page } from "$app/state";

  import CombinedTitleDisplay from "$lib/components/CombinedTitleDisplay.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import ErrorText from "$lib/components/ErrorText.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import PreviousUrlInput from "$lib/components/PreviousURLInput.svelte";
  import PrevPageButton from "$lib/components/PrevPageButton.svelte";
  import SelectInput from "$lib/components/SelectInput.svelte";
  import TextInput from "$lib/components/TextInput.svelte";
  import { pageInfo, urlGenerator } from "$lib/routes.js";

  const { data } = $props();

  const { form, errors, constraints, message, enhance } = superForm(data.form);

  const urlInfo = pageInfo("/(loggedIn)/categories/[id]", () => page);
  const deleteURL = $derived(
    urlGenerator({
      address: "/(loggedIn)/categories/[id]/delete",
      paramsValue: { id: data.category.id },
    }).url,
  );
</script>

<CustomHeader pageTitle="Edit Category" filterText={data.category.title} />

<PageLayout title={data.category.title} size="sm">
  <form method="POST" class="flex flex-col gap-2" use:enhance>
    <input type="hidden" name="id" value={data.category.id} />
    <PreviousUrlInput name="prevPage" />
    <input type="hidden" name="currentPage" value={urlInfo.updateParamsURLGenerator({}).url} />
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

  <PrevPageButton outline>Cancel</PrevPageButton>
  <Button outline color="red" href={deleteURL}>Delete</Button>
</PageLayout>
