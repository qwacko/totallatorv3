<script lang="ts">
  import { Button, P } from "flowbite-svelte";

  import { enhance } from "$app/forms";

  import ActionButton from "$lib/components/ActionButton.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import { customEnhance } from "$lib/helpers/customEnhance";
  import { urlGenerator } from "$lib/routes.js";

  const { data } = $props();

  let loading = $state(false);
</script>

<CustomHeader
  pageTitle="Delete Auto Import"
  filterText={data.autoImportDetail.title}
/>

<PageLayout title="Delete Auto Import" subtitle={data.autoImportDetail.title}>
  <P>
    Delete automatic import {data.autoImportDetail.title}? Note that this will
    not remove any existing imports.
  </P>
  <Button
    href={urlGenerator({
      address: "/(loggedIn)/autoImport/[id]",
      paramsValue: { id: data.id },
    }).url}
  >
    Cancel
  </Button>
  <form
    method="post"
    use:enhance={customEnhance({
      updateLoading: (newLoading) => (loading = newLoading),
    })}
    class="flex w-full"
  >
    <ActionButton
      color="red"
      type="submit"
      class="flex w-full"
      message="Delete Auto Import"
      loadingMessage="Deleting..."
      {loading}
    />
  </form>
</PageLayout>
