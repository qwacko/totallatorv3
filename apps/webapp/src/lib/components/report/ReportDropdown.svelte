<script lang="ts">
  import {
    Button,
    Dropdown,
    DropdownDivider,
    DropdownItem,
  } from "flowbite-svelte";

  import type { ReportDropdownType } from "@totallator/business-logic";

  import { urlGenerator } from "$lib/routes";

  import ArrowRightIcon from "../icons/ArrowRightIcon.svelte";

  const { items }: { items: ReportDropdownType } = $props();
</script>

<Button class="p-2" outline>Reports</Button>
<Dropdown simple>
  {#each items as currentItem}
    {#if "reports" in currentItem}
      <DropdownItem class="flex items-center justify-between gap-2">
        {currentItem.group}<ArrowRightIcon />
      </DropdownItem>
      <Dropdown simple>
        {#each currentItem.reports as report}
          <DropdownItem
            href={urlGenerator({
              address: "/(loggedIn)/reports/[id]",
              paramsValue: { id: report.id },
              searchParamsValue: {},
            }).url}
            class="flex flex-row gap-2"
          >
            {report.title}
          </DropdownItem>
        {/each}
      </Dropdown>
    {:else}
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/reports/[id]",
          paramsValue: { id: currentItem.id },
          searchParamsValue: {},
        }).url}
      >
        {currentItem.title}
      </DropdownItem>
    {/if}
  {/each}
  <DropdownDivider />
  <DropdownItem
    href={urlGenerator({ address: "/(loggedIn)/reports/create" }).url}
  >
    New Report
  </DropdownItem>
</Dropdown>
