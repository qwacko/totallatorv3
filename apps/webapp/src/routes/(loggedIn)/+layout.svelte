<script lang="ts">
  import { DarkMode } from "flowbite-svelte";
  import {
    Button,
    Dropdown,
    DropdownDivider,
    DropdownItem,
  } from "flowbite-svelte";

  import { page } from "$app/stores";

  import FilterDropdown from "$lib/components/FilterDropdown.svelte";
  import FilterSelectionModal from "$lib/components/FilterSelectionModal.svelte";
  import AccountIcon from "$lib/components/icons/AccountIcon.svelte";
  import ArrowLeftIcon from "$lib/components/icons/ArrowLeftIcon.svelte";
  import AutoImportIcon from "$lib/components/icons/AutoImportIcon.svelte";
  import BackupIcon from "$lib/components/icons/BackupIcon.svelte";
  import BillIcon from "$lib/components/icons/BillIcon.svelte";
  import BudgetIcon from "$lib/components/icons/BudgetIcon.svelte";
  import CategoryIcon from "$lib/components/icons/CategoryIcon.svelte";
  import DBGroupedQueryIcon from "$lib/components/icons/DBGroupedQueryIcon.svelte";
  import DBQueryIcon from "$lib/components/icons/DBQueryIcon.svelte";
  import DevIcon from "$lib/components/icons/DevIcon.svelte";
  import EyeIcon from "$lib/components/icons/EyeIcon.svelte";
  import FileIcon from "$lib/components/icons/FileIcon.svelte";
  import IdeaIcon from "$lib/components/icons/IdeaIcon.svelte";
  import ImportIcon from "$lib/components/icons/ImportIcon.svelte";
  import LabelIcon from "$lib/components/icons/LabelIcon.svelte";
  import MenuIcon from "$lib/components/icons/MenuIcon.svelte";
  import ReusableFilterIcon from "$lib/components/icons/ReusableFilterIcon.svelte";
  import SettingsIcon from "$lib/components/icons/SettingsIcon.svelte";
  import TagIcon from "$lib/components/icons/TagIcon.svelte";
  import UserAccountIcon from "$lib/components/icons/UserAccountIcon.svelte";
  import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
  import CronIcon from "$lib/components/icons/CronIcon.svelte";
  import NotificationDisplay from "$lib/components/NotificationDisplay.svelte";
  import ReportDropdown from "$lib/components/report/ReportDropdown.svelte";
  import { urlGenerator } from "$lib/routes";
  import UpdateDropdowns from "$lib/stores/UpdateDropdowns.svelte";
  import { userInfoUpdateStore } from "$lib/stores/userInfoStore.js";

  const { data, children } = $props();

  $effect(() => {
    $userInfoUpdateStore = data.user;
  });

  const pageIsBills = $derived($page.route.id?.startsWith("/(loggedIn)/bills"));
  const pageIsTags = $derived($page.route.id?.startsWith("/(loggedIn)/tags"));
  const pageIsLabels = $derived(
    $page.route.id?.startsWith("/(loggedIn)/labels"),
  );
  const pageIsBudgets = $derived(
    $page.route.id?.startsWith("/(loggedIn)/budgets"),
  );
  const pageIsCategories = $derived(
    $page.route.id?.startsWith("/(loggedIn)/categories"),
  );
  const pageIsAccounts = $derived(
    $page.route.id?.startsWith("/(loggedIn)/accounts"),
  );
  const pageIsDev = $derived($page.route.id?.startsWith("/(loggedIn)/dev"));
  const pageIsImportMapping = $derived(
    $page.route.id?.startsWith("/(loggedIn)/importMapping"),
  );
  const pageIsAutoImport = $derived(
    $page.route.id?.startsWith("/(loggedIn)/autoImport"),
  );
  const pageIsImport = $derived(
    $page.route.id?.startsWith("/(loggedIn)/import") && !pageIsImportMapping,
  );
  const pageIsBackup = $derived(
    $page.route.id?.startsWith("/(loggedIn)/backup"),
  );
  const pageIsCurrentUser = $derived(
    data.user?.id ? $page.url.toString().includes(data.user.id) : false,
  );
  const pageIsUsers = $derived(
    $page.route.id?.startsWith("/(loggedIn)/users") && !pageIsCurrentUser,
  );
  const pageIsFilters = $derived(
    $page.route.id?.startsWith("/(loggedIn)/filters"),
  );
  const pageIsFiles = $derived($page.route.id?.startsWith("/(loggedIn)/files"));
  const pageIsQueryLog = $derived(
    $page.route.id?.startsWith("/(loggedIn)/queries/list"),
  );
  const pageIsGroupedQueries = $derived(
    $page.route.id?.startsWith("/(loggedIn)/queries/grouped"),
  );
  const pageIsSettings = $derived(
    $page.route.id?.startsWith("/(loggedIn)/settings"),
  );
  const pageIsLLM = $derived($page.route.id?.startsWith("/(loggedIn)/llm"));
  const pageIsCron = $derived($page.route.id?.startsWith("/(loggedIn)/admin/cron"));

  const pageMap = $derived([
    {
      label: "Bills",
      active: pageIsBills,
      icon: BillIcon,
      href: urlGenerator({
        address: "/(loggedIn)/bills",
        searchParamsValue: {},
      }),
    },
    {
      label: "Tags",
      active: pageIsTags,
      icon: TagIcon,
      href: urlGenerator({
        address: "/(loggedIn)/tags",
        searchParamsValue: {},
      }),
    },
    {
      label: "Labels",
      active: pageIsLabels,
      icon: LabelIcon,
      href: urlGenerator({
        address: "/(loggedIn)/labels",
        searchParamsValue: {},
      }),
    },
    {
      label: "Budgets",
      active: pageIsBudgets,
      icon: BudgetIcon,
      href: urlGenerator({
        address: "/(loggedIn)/budgets",
        searchParamsValue: {},
      }),
    },
    {
      label: "Categories",
      active: pageIsCategories,
      icon: CategoryIcon,
      href: urlGenerator({
        address: "/(loggedIn)/categories",
        searchParamsValue: {},
      }),
    },
    {
      label: "Accounts",
      active: pageIsAccounts,
      icon: AccountIcon,
      href: urlGenerator({
        address: "/(loggedIn)/accounts",
        searchParamsValue: {},
      }),
    },
    {
      label: "Files",
      active: pageIsFiles,
      icon: FileIcon,
      href: urlGenerator({
        address: "/(loggedIn)/files",
        searchParamsValue: {},
      }),
    },
    {
      label: "Reusable Filters",
      active: pageIsFilters,
      icon: ReusableFilterIcon,
      href: urlGenerator({
        address: "/(loggedIn)/filters",
        searchParamsValue: {},
      }),
    },
    {
      label: "Import",
      active: pageIsImport,
      icon: ImportIcon,
      href: urlGenerator({
        address: "/(loggedIn)/import",
        searchParamsValue: {},
      }),
    },
    {
      label: "Import Mapping",
      active: pageIsImportMapping,
      icon: ImportIcon,
      href: urlGenerator({
        address: "/(loggedIn)/importMapping",
        searchParamsValue: {},
      }),
    },
    {
      label: "Auto Import",
      active: pageIsAutoImport,
      icon: AutoImportIcon,
      href: urlGenerator({
        address: "/(loggedIn)/autoImport",
        searchParamsValue: {},
      }),
    },
    {
      label: "Backup",
      active: pageIsBackup,
      icon: BackupIcon,
      href: urlGenerator({
        address: "/(loggedIn)/backup",
        searchParamsValue: { page: 0 },
      }),
    },
    ...(data.enableDBLog
      ? [
          {
            label: "Query Groups",
            active: pageIsGroupedQueries,
            icon: DBGroupedQueryIcon,
            href: urlGenerator({
              address: "/(loggedIn)/queries/grouped",
              searchParamsValue: { page: 0, pageSize: 10 },
            }),
          },
          {
            label: "Queries",
            active: pageIsQueryLog,
            icon: DBQueryIcon,
            href: urlGenerator({
              address: "/(loggedIn)/queries/list",
              searchParamsValue: {
                page: 0,
                pageSize: 10,
                textFilter: "last:60",
              },
            }),
          },
        ]
      : []),
    ...(data.user
      ? [
          {
            label: "User",
            active: pageIsCurrentUser,
            icon: UserAccountIcon,
            href: urlGenerator({
              address: "/(loggedIn)/users/[id]",
              paramsValue: { id: data.user?.id },
            }),
          },
        ]
      : []),
    ...(data.user?.admin
      ? [
          {
            label: "Users",
            active: pageIsUsers,
            icon: UsersIcon,
            href: urlGenerator({
              address: "/(loggedIn)/users",
              searchParamsValue: { page: 0 },
            }),
          },
          {
            label: "LLM",
            active: pageIsLLM,
            icon: IdeaIcon,
            href: urlGenerator({ address: "/(loggedIn)/llm/providers" }),
          },
          {
            label: "Cron Jobs",
            active: pageIsCron,
            icon: CronIcon,
            href: urlGenerator({ address: "/(loggedIn)/admin/cron" }),
          },
          {
            label: "Settings",
            active: pageIsSettings,
            icon: SettingsIcon,
            href: urlGenerator({ address: "/(loggedIn)/settings" }),
          },
        ]
      : []),
    ...(data.dev
      ? [
          {
            label: "Dev",
            active: pageIsDev,
            icon: DevIcon,
            href: urlGenerator({ address: "/(loggedIn)/dev/bulkLoad" }),
          },
        ]
      : []),
  ]);

  let filterSelectionModalOpened = $state(false);
</script>

<UpdateDropdowns dataUpdated={data.dataUpdated} />

<div class="flex flex-col justify-stretch p-2">
  <div class="flex flex-row gap-2 pb-8 pt-4 md:hidden">
    <FilterSelectionModal
      showDefaultJournalFilters
      filters={data.filterDropdown}
      newFilter={(newFilter) =>
        urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: {
            ...newFilter,
            page: 0,
            pageSize: 10,
          },
        }).url}
      updateFilter={(newFilter) =>
        urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: newFilter,
        }).url}
      bind:shown={filterSelectionModalOpened}
    />
    <div class="flex grow"></div>
    <DarkMode />
    <Button outline><MenuIcon /></Button>
    <Dropdown simple>
      <DropdownItem
        class="flex flex-row gap-2"
        href={urlGenerator({ address: "/(loggedIn)/files/create" }).url}
      >
        <FileIcon />Add File
      </DropdownItem>
      <DropdownItem
        class="flex flex-row gap-2"
        onclick={() => (filterSelectionModalOpened = true)}
      >
        Journals
      </DropdownItem>

      {#if data.user?.admin}
        <DropdownItem class="flex flex-row gap-2"
          ><ArrowLeftIcon />LLM</DropdownItem
        >
        <Dropdown placement="left" simple>
          <DropdownItem
            href={urlGenerator({ address: "/(loggedIn)/llm/providers" }).url}
          >
            <div class="flex flex-row items-center gap-2">
              <IdeaIcon />Providers
            </div>
          </DropdownItem>
          <DropdownItem
            href={urlGenerator({
              address: "/(loggedIn)/llm/logs",
              searchParamsValue: { page: 0, pageSize: 20 },
            }).url}
          >
            <div class="flex flex-row items-center gap-2">
              <EyeIcon />Logs
            </div>
          </DropdownItem>
        </Dropdown>
      {/if}

      <DropdownItem class="flex flex-row gap-2"
        ><ArrowLeftIcon />Config</DropdownItem
      >
      <Dropdown placement="left" simple>
        {#each pageMap as currentPage}
          <DropdownItem href={currentPage.href.url}>
            <div class="flex flex-row items-center gap-2">
              <currentPage.icon />{currentPage.label}
            </div>
          </DropdownItem>
        {/each}
      </Dropdown>
      <DropdownDivider />
      <DropdownItem href={urlGenerator({ address: "/(loggedIn)/logout" }).url}
        >Logout</DropdownItem
      >
    </Dropdown>
  </div>

  <div class="hidden flex-row flex-wrap justify-center gap-2 pb-8 pt-4 md:flex">
    <Button
      href={urlGenerator({ address: "/(loggedIn)/files/create" }).url}
      outline
      size="xs"
    >
      <FileIcon />
    </Button>
    <ReportDropdown items={data.reportDropdown} />
    <FilterDropdown
      showDefaultJournalFilters
      hideIcon
      buttonText="Journals"
      filters={data.filterDropdown}
      newFilter={(newFilter) =>
        urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: {
            ...newFilter,
            page: 0,
            pageSize: 10,
          },
        }).url}
      updateFilter={(newFilter) =>
        urlGenerator({
          address: "/(loggedIn)/journals",
          searchParamsValue: newFilter,
        }).url}
      currentFilter={{
        page: 0,
        pageSize: 10,
        orderBy: [{ field: "date", direction: "desc" }],
      }}
    />
    {#if data.user?.admin}
      <Button outline>LLM</Button>
      <Dropdown simple>
        <DropdownItem
          href={urlGenerator({ address: "/(loggedIn)/llm/providers" }).url}
          classes={{ anchor: "flex flex-row items-center gap-2" }}
        >
          <IdeaIcon />Provider
        </DropdownItem>
        <DropdownItem
          href={urlGenerator({
            address: "/(loggedIn)/llm/logs",
            searchParamsValue: { page: 0, pageSize: 20 },
          }).url}
        >
          <div class="flex flex-row items-center gap-2">
            <EyeIcon />Logs
          </div>
        </DropdownItem>
      </Dropdown>
    {/if}

    <Button outline>Config</Button>
    <Dropdown simple>
      {#each pageMap as currentPage, i}
        {@const DisplayIcon = currentPage.icon}
        <DropdownItem
          href={currentPage.href.url}
          class="{currentPage.active
            ? 'bg-primary-600 text-primary-200'
            : ''} {i === 0 ? 'rounded-t-lg' : ''}"
        >
          <div class="flex flex-row items-center gap-2">
            <DisplayIcon />{currentPage.label}
          </div>
        </DropdownItem>
      {/each}
      <DropdownDivider />

      <DropdownItem href={urlGenerator({ address: "/(loggedIn)/logout" }).url}
        >Logout</DropdownItem
      >
    </Dropdown>
    <DarkMode />
  </div>
  {@render children()}
  <NotificationDisplay />
</div>
