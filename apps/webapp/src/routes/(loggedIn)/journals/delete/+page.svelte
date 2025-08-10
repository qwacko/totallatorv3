<script lang="ts">
  import { Button } from "flowbite-svelte";

  import { enhance } from "$app/forms";
  import { page } from "$app/state";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import PreviousUrlInput from "$lib/components/PreviousURLInput.svelte";
  import PrevPageButton from "$lib/components/PrevPageButton.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";
  import { pageInfo } from "$lib/routes";

  const { data } = $props();

  const urlInfo = pageInfo("/(loggedIn)/journals/clone", () => page);
</script>

<CustomHeader
  pageTitle="Delete {data.journals.count} Journals"
  filterText={data.filterText}
/>

<PageLayout title="Delete {data.journals.count} Journals">
  <RawDataModal {data} dev={data.dev} />

  <form method="post" action="?/delete" use:enhance class="flex flex-col gap-4">
    <PreviousUrlInput name="prevPage" />
    <input
      type="hidden"
      name="filter"
      value={JSON.stringify(urlInfo.current.searchParams)}
    />
    <input type="hidden" name="currentPage" value={urlInfo.updateParamsURLGenerator({}).url} />
    <Button class="w-full" type="submit">Delete {data.count} Journals</Button>
    <PrevPageButton outline>Cancel</PrevPageButton>
  </form>
</PageLayout>
