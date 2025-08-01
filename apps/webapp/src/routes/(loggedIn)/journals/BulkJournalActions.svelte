<script lang="ts">
  import {
    Button,
    ButtonGroup,
    Dropdown,
    DropdownItem,
    P,
  } from "flowbite-svelte";

  import {
    defaultAllJournalFilter,
    defaultJournalFilter,
    type JournalFilterSchemaType,
  } from "@totallator/shared";

  import ArrowRightIcon from "$lib/components/icons/ArrowRightIcon.svelte";
  import CloneIcon from "$lib/components/icons/CloneIcon.svelte";
  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";
  import EditIcon from "$lib/components/icons/EditIcon.svelte";
  import EyeIcon from "$lib/components/icons/EyeIcon.svelte";
  import FilterIcon from "$lib/components/icons/FilterIcon.svelte";
  import { urlGenerator } from "$lib/routes";

  const {
    selectedIds,
    searchParams,
    allCount,
  }: {
    selectedIds: string[];
    searchParams: JournalFilterSchemaType | undefined;
    allCount: number;
  } = $props();
</script>

<div class="flex flex-row items-center gap-2">
  <P size="sm" weight="semibold" class="w-max whitespace-nowrap">
    Selected ({selectedIds.length})
  </P>
  <ButtonGroup>
    <Button
      class="p-2"
      color="light"
      href={urlGenerator({
        address: "/(loggedIn)/journals/bulkEdit",
        searchParamsValue: {
          idArray: selectedIds,
          ...defaultAllJournalFilter(),
        },
      }).url}
      disabled={selectedIds.length === 0}
    >
      <EditIcon />
    </Button>
    <Button
      class="p-2"
      color="light"
      href={urlGenerator({
        address: "/(loggedIn)/journals/clone",
        searchParamsValue: {
          idArray: selectedIds,
          ...defaultAllJournalFilter(),
        },
      }).url}
      disabled={selectedIds.length === 0}
    >
      <CloneIcon />
    </Button>
    <Button
      class="p-2"
      color="light"
      href={urlGenerator({
        address: "/(loggedIn)/journals/delete",
        searchParamsValue: {
          idArray: selectedIds,
          ...defaultAllJournalFilter(),
        },
      }).url}
      disabled={selectedIds.length === 0}
    >
      <DeleteIcon />
    </Button>
    <Button
      class="p-2"
      color="light"
      href={urlGenerator({
        address: "/(loggedIn)/journals",
        searchParamsValue: {
          idArray: selectedIds,
          ...defaultAllJournalFilter(),
          account: {},
        },
      }).url}
      disabled={selectedIds.length === 0}
    >
      <EyeIcon />
    </Button>
  </ButtonGroup>
  <Button outline color="light" size="xs"
    >All Journal Actions ({allCount})</Button
  >
  <Dropdown simple>
    <DropdownItem>
      <div class="flex flex-row items-center justify-between gap-1">
        All<ArrowRightIcon />
      </div>
    </DropdownItem>
    <Dropdown simple>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/bulkEdit",
          searchParamsValue: searchParams
            ? { ...searchParams, pageSize: 100000, page: 0 }
            : undefined,
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><EditIcon />Edit</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/clone",
          searchParamsValue: searchParams
            ? { ...searchParams, pageSize: 100000, page: 0 }
            : undefined,
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><CloneIcon />Clone</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/delete",
          searchParamsValue: searchParams
            ? { ...searchParams, pageSize: 100000, page: 0 }
            : undefined,
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><DeleteIcon />Delete</div>
      </DropdownItem>
    </Dropdown>
    <DropdownItem>
      <div class="flex flex-row items-center justify-between gap-1">
        Incomplete<ArrowRightIcon />
      </div>
    </DropdownItem>
    <Dropdown simple>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/bulkEdit",
          searchParamsValue: searchParams
            ? { ...searchParams, complete: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                complete: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><EditIcon />Edit</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/clone",
          searchParamsValue: searchParams
            ? { ...searchParams, complete: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                complete: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><CloneIcon />Clone</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/delete",
          searchParamsValue: searchParams
            ? { ...searchParams, complete: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                complete: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><DeleteIcon />Delete</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: searchParams
            ? { ...searchParams, complete: false }
            : { ...defaultJournalFilter(), complete: false },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><FilterIcon />View</div>
      </DropdownItem>
    </Dropdown>
    <DropdownItem>
      <div class="flex flex-row items-center justify-between gap-1">
        Data Unchecked<ArrowRightIcon />
      </div>
    </DropdownItem>
    <Dropdown simple>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/bulkEdit",
          searchParamsValue: searchParams
            ? { ...searchParams, dataChecked: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><EditIcon />Edit</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/clone",
          searchParamsValue: searchParams
            ? { ...searchParams, dataChecked: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><CloneIcon />Clone</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/delete",
          searchParamsValue: searchParams
            ? { ...searchParams, dataChecked: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><DeleteIcon />Delete</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: searchParams
            ? { ...searchParams, dataChecked: false }
            : { ...defaultJournalFilter(), dataChecked: false },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><FilterIcon />View</div>
      </DropdownItem>
    </Dropdown>
    <DropdownItem>
      <div class="flex flex-row items-center justify-between gap-1">
        Unreconciled<ArrowRightIcon />
      </div>
    </DropdownItem>
    <Dropdown simple>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/bulkEdit",
          searchParamsValue: searchParams
            ? { ...searchParams, reconciled: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                reconciled: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><EditIcon />Edit</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/clone",
          searchParamsValue: searchParams
            ? { ...searchParams, reconciled: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                reconciled: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><CloneIcon />Clone</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/delete",
          searchParamsValue: searchParams
            ? { ...searchParams, reconciled: false, pageSize: 100000, page: 0 }
            : {
                ...defaultAllJournalFilter(),
                reconciled: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><DeleteIcon />Delete</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: searchParams
            ? { ...searchParams, reconciled: false }
            : { ...defaultJournalFilter(), reconciled: false },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><FilterIcon />View</div>
      </DropdownItem>
    </Dropdown>
    <DropdownItem>
      <div class="flex flex-row items-center justify-between gap-2">
        Unchecked and Incomplete<ArrowRightIcon />
      </div>
    </DropdownItem>
    <Dropdown simple>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/bulkEdit",
          searchParamsValue: searchParams
            ? {
                ...searchParams,
                reconciled: false,
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              }
            : {
                ...defaultAllJournalFilter(),
                reconciled: false,
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><EditIcon />Edit</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/clone",
          searchParamsValue: searchParams
            ? {
                ...searchParams,
                reconciled: false,
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              }
            : {
                ...defaultAllJournalFilter(),
                reconciled: false,
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><CloneIcon />Clone</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals/delete",
          searchParamsValue: searchParams
            ? {
                ...searchParams,
                reconciled: false,
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              }
            : {
                ...defaultAllJournalFilter(),
                reconciled: false,
                dataChecked: false,
                pageSize: 100000,
                page: 0,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><DeleteIcon />Delete</div>
      </DropdownItem>
      <DropdownItem
        href={urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: searchParams
            ? { ...searchParams, reconciled: false, dataChecked: false }
            : {
                ...defaultJournalFilter(),
                reconciled: false,
                dataChecked: false,
              },
        }).url}
      >
        <div class="flex flex-row items-center gap-1"><FilterIcon />View</div>
      </DropdownItem>
    </Dropdown>
  </Dropdown>
</div>
