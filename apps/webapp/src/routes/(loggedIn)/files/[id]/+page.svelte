<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";

  import ActionButton from "$lib/components/ActionButton.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import FileThumbnail from "$lib/components/FileThumbnail.svelte";
  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import TextInput from "$lib/components/TextInput.svelte";
  import { urlGenerator } from "$lib/routes.js";

  const { data } = $props();
  let updating = $state(false);

  const { enhance, form, constraints, errors } = superForm(data.form, {
    onSubmit: () => (updating = true),
    onResult: () => (updating = false),
  });

  const deleteURL = $derived(
    urlGenerator({
      address: "/(loggedIn)/files/[id]/delete",
      paramsValue: { id: data.file.id },
    }).url,
  );
</script>

<CustomHeader
  pageTitle="Edit File"
  filterText={data.file.title || data.file.originalFilename}
/>

<PageLayout title={data.file.title || data.file.originalFilename} size="lg">
  <div class="self-center">
    <FileThumbnail item={data.file} size="lg" />
  </div>
  <form
    method="post"
    action="?/updateFile"
    use:enhance
    class="flex w-full flex-row items-end gap-2"
  >
    <input type="hidden" name="id" value={data.file.id} />
    <TextInput
      class="flex grow"
      wrapperClass="flex grow"
      title="Title"
      name="title"
      bind:value={$form.title}
      {...$constraints.title}
      errorMessage={$errors.title}
    />
    <ActionButton
      type="submit"
      color="primary"
      message="Update"
      loadingMessage="Updating..."
      loading={updating}
    />
  </form>
  <Button outline color="red" href={deleteURL}><DeleteIcon /></Button>
</PageLayout>
