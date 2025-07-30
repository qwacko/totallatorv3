<script lang="ts">
  import { Button, Dropdown, DropdownItem } from "flowbite-svelte";

  import {
    downloadTypeEnum,
    type DownloadTypeEnumType,
    downloadTypeToString,
  } from "@totallator/shared";

  import DownloadIcon from "./icons/DownloadIcon.svelte";

  const {
    urlGenerator,
  }: { urlGenerator: (dType: DownloadTypeEnumType) => string } = $props();
</script>

<Button size="sm" class="flex p-2" color="blue" outline>
  <DownloadIcon />
</Button>
<Dropdown data-sveltekit-preload-data="off">
  {#each downloadTypeEnum as currentDownloadType}
    <DropdownItem href={urlGenerator(currentDownloadType)}>
      {downloadTypeToString(currentDownloadType)}
    </DropdownItem>
  {/each}
</Dropdown>
