<script lang="ts">
  import {
    Button,
    Dropdown,
    DropdownDivider,
    DropdownItem,
    Spinner,
  } from "flowbite-svelte";

  import DropdownItemForm from "$lib/components/DropdownItemForm.svelte";
  import ArrowDownIcon from "$lib/components/icons/ArrowDownIcon.svelte";
  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";
  import DownloadIcon from "$lib/components/icons/DownloadIcon.svelte";
  import ImportIcon from "$lib/components/icons/ImportIcon.svelte";
  import { urlGenerator } from "$lib/routes";

  let {
    importMappingId,
    autoImportId,
    filename,
    loading = $bindable(false),
  }: {
    importMappingId: string;
    autoImportId: string;
    filename: string;
    loading?: boolean;
  } = $props();
</script>

<Button color="light" size="sm" class="flex flex-row gap-2">
  {#if loading}<Spinner size="6" />{/if}Actions<ArrowDownIcon />
</Button>
<Dropdown simple>
  <DropdownItem
    href={urlGenerator({
      address: "/(loggedIn)/autoImport/[id]/[filename]",
      paramsValue: { id: autoImportId, filename },
    }).url}
    class="flex flex-row gap-2"
  >
    <DownloadIcon />Download Data
  </DropdownItem>
  <DropdownItem
    href={urlGenerator({
      address: "/(loggedIn)/importMapping/[id]",
      paramsValue: { id: importMappingId },
    }).url}
    class="flex flex-row gap-2"
  >
    <ImportIcon />Go To Import Mapping
  </DropdownItem>
  <DropdownItemForm
    bind:loading
    action="?/updateSampleData"
    successMessage="Successfully Updated Sample Data"
    errorMessage="Failed to Update Sample Data"
  >
    <ImportIcon /> Update Sample Data
    {#snippet slotLoading()}<Spinner />Updating...{/snippet}
  </DropdownItemForm>
  <DropdownItemForm action="?/trigger" bind:loading class="flex flex-row gap-2">
    <ImportIcon /> Trigger Import
  </DropdownItemForm>
  <DropdownItem
    href={urlGenerator({
      address: "/(loggedIn)/import",
      searchParamsValue: { pageSize: 10, autoImportId },
    }).url}
    class="flex flex-row gap-2"
  >
    <ImportIcon />List Imports
  </DropdownItem>
  <DropdownDivider />
  <DropdownItem
    color="red"
    href={urlGenerator({
      address: "/(loggedIn)/autoImport/[id]/delete",
      paramsValue: { id: autoImportId },
    }).url}
    class="flex flex-row gap-2"
  >
    <DeleteIcon color="red" />Delete
  </DropdownItem>
</Dropdown>
