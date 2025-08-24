<script lang="ts">
	import { DarkMode } from 'flowbite-svelte';
	import { Button, Dropdown, DropdownDivider, DropdownItem } from 'flowbite-svelte';
	import { ChevronRightOutline } from 'flowbite-svelte-icons';

	import { page } from '$app/state';

	import FilterDropdown from '$lib/components/FilterDropdown.svelte';
	import FilterSelectionModal from '$lib/components/FilterSelectionModal.svelte';
	import AccountIcon from '$lib/components/icons/AccountIcon.svelte';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import AutoImportIcon from '$lib/components/icons/AutoImportIcon.svelte';
	import BackupIcon from '$lib/components/icons/BackupIcon.svelte';
	import BillIcon from '$lib/components/icons/BillIcon.svelte';
	import BudgetIcon from '$lib/components/icons/BudgetIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import CronIcon from '$lib/components/icons/CronIcon.svelte';
	import DBGroupedQueryIcon from '$lib/components/icons/DBGroupedQueryIcon.svelte';
	import DBQueryIcon from '$lib/components/icons/DBQueryIcon.svelte';
	import DevIcon from '$lib/components/icons/DevIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import FileIcon from '$lib/components/icons/FileIcon.svelte';
	import IdeaIcon from '$lib/components/icons/IdeaIcon.svelte';
	import ImportIcon from '$lib/components/icons/ImportIcon.svelte';
	import LabelIcon from '$lib/components/icons/LabelIcon.svelte';
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';
	import ReusableFilterIcon from '$lib/components/icons/ReusableFilterIcon.svelte';
	import SettingsIcon from '$lib/components/icons/SettingsIcon.svelte';
	import TagIcon from '$lib/components/icons/TagIcon.svelte';
	import UserAccountIcon from '$lib/components/icons/UserAccountIcon.svelte';
	import UsersIcon from '$lib/components/icons/UsersIcon.svelte';
	import NotificationDisplay from '$lib/components/NotificationDisplay.svelte';
	import ReportDropdown from '$lib/components/report/ReportDropdown.svelte';
	import { urlGenerator } from '$lib/routes';
	import UpdateDropdowns from '$lib/stores/UpdateDropdowns.svelte';
	import { userInfoUpdateStore } from '$lib/stores/userInfoStore.js';

	const { data, children } = $props();

	$effect(() => {
		$userInfoUpdateStore = data.user;
	});

	const pageIsBills = $derived(page.route.id?.startsWith('/(loggedIn)/bills'));
	const pageIsTags = $derived(page.route.id?.startsWith('/(loggedIn)/tags'));
	const pageIsLabels = $derived(page.route.id?.startsWith('/(loggedIn)/labels'));
	const pageIsBudgets = $derived(page.route.id?.startsWith('/(loggedIn)/budgets'));
	const pageIsCategories = $derived(page.route.id?.startsWith('/(loggedIn)/categories'));
	const pageIsAccounts = $derived(page.route.id?.startsWith('/(loggedIn)/accounts'));
	const pageIsDev = $derived(page.route.id?.startsWith('/(loggedIn)/dev'));
	const pageIsImportMapping = $derived(page.route.id?.startsWith('/(loggedIn)/importMapping'));
	const pageIsAutoImport = $derived(page.route.id?.startsWith('/(loggedIn)/autoImport'));
	const pageIsImport = $derived(
		page.route.id?.startsWith('/(loggedIn)/import') && !pageIsImportMapping
	);
	const pageIsBackup = $derived(page.route.id?.startsWith('/(loggedIn)/backup'));
	const pageIsCurrentUser = $derived(
		data.user?.id ? page.url.toString().includes(data.user.id) : false
	);
	const pageIsUsers = $derived(
		page.route.id?.startsWith('/(loggedIn)/users') && !pageIsCurrentUser
	);
	const pageIsFilters = $derived(page.route.id?.startsWith('/(loggedIn)/filters'));
	const pageIsFiles = $derived(page.route.id?.startsWith('/(loggedIn)/files'));
	const pageIsQueryLog = $derived(page.route.id?.startsWith('/(loggedIn)/queries/list'));
	const pageIsGroupedQueries = $derived(page.route.id?.startsWith('/(loggedIn)/queries/grouped'));
	const pageIsSettings = $derived(page.route.id?.startsWith('/(loggedIn)/settings'));
	const pageIsLLM = $derived(page.route.id?.startsWith('/(loggedIn)/llm'));
	const pageIsCron = $derived(page.route.id?.startsWith('/(loggedIn)/admin/cron'));
	const pageIsLogs = $derived(page.route.id?.startsWith('/(loggedIn)/logs'));
	const pageIsLogConfiguration = $derived(
		page.route.id?.startsWith('/(loggedIn)/logConfiguration')
	);

	const pageGroups = $derived({
		linkedItems: [
			{
				label: 'Bills',
				active: pageIsBills,
				icon: BillIcon,
				href: urlGenerator({
					address: '/(loggedIn)/bills',
					searchParamsValue: {}
				})
			},
			{
				label: 'Budgets',
				active: pageIsBudgets,
				icon: BudgetIcon,
				href: urlGenerator({
					address: '/(loggedIn)/budgets',
					searchParamsValue: {}
				})
			},
			{
				label: 'Categories',
				active: pageIsCategories,
				icon: CategoryIcon,
				href: urlGenerator({
					address: '/(loggedIn)/categories',
					searchParamsValue: {}
				})
			},
			{
				label: 'Tags',
				active: pageIsTags,
				icon: TagIcon,
				href: urlGenerator({
					address: '/(loggedIn)/tags',
					searchParamsValue: {}
				})
			},
			{
				label: 'Labels',
				active: pageIsLabels,
				icon: LabelIcon,
				href: urlGenerator({
					address: '/(loggedIn)/labels',
					searchParamsValue: {}
				})
			},
			{
				label: 'Accounts',
				active: pageIsAccounts,
				icon: AccountIcon,
				href: urlGenerator({
					address: '/(loggedIn)/accounts',
					searchParamsValue: {}
				})
			}
		],
		imports: [
			{
				label: 'Import',
				active: pageIsImport,
				icon: ImportIcon,
				href: urlGenerator({
					address: '/(loggedIn)/import',
					searchParamsValue: {}
				})
			},
			{
				label: 'Import Mapping',
				active: pageIsImportMapping,
				icon: ImportIcon,
				href: urlGenerator({
					address: '/(loggedIn)/importMapping',
					searchParamsValue: {}
				})
			},
			{
				label: 'Auto Import',
				active: pageIsAutoImport,
				icon: AutoImportIcon,
				href: urlGenerator({
					address: '/(loggedIn)/autoImport',
					searchParamsValue: {}
				})
			}
		],
		llm: data.user?.admin
			? [
					{
						label: 'Providers',
						active: pageIsLLM,
						icon: IdeaIcon,
						href: urlGenerator({ address: '/(loggedIn)/llm/providers' })
					},
					{
						label: 'Logs',
						active: pageIsLLM,
						icon: EyeIcon,
						href: urlGenerator({
							address: '/(loggedIn)/llm/logs',
							searchParamsValue: { page: 0, pageSize: 20 }
						})
					}
				]
			: [],
		database: data.enableDBLog
			? [
					{
						label: 'Query Groups',
						active: pageIsGroupedQueries,
						icon: DBGroupedQueryIcon,
						href: urlGenerator({
							address: '/(loggedIn)/queries/grouped',
							searchParamsValue: { page: 0, pageSize: 10 }
						})
					},
					{
						label: 'Queries',
						active: pageIsQueryLog,
						icon: DBQueryIcon,
						href: urlGenerator({
							address: '/(loggedIn)/queries/list',
							searchParamsValue: {
								page: 0,
								pageSize: 10,
								textFilter: 'last:60'
							}
						})
					}
				]
			: [],
		logging: [
			{
				label: 'Logs',
				active: pageIsLogs,
				icon: EyeIcon,
				href: urlGenerator({
					address: '/(loggedIn)/logs'
				})
			},
			{
				label: 'Log Configuration',
				active: pageIsLogConfiguration,
				icon: SettingsIcon,
				href: urlGenerator({
					address: '/(loggedIn)/logConfiguration'
				})
			}
		],
		systemAdmin: data.user?.admin
			? [
					{
						label: 'Users',
						active: pageIsUsers,
						icon: UsersIcon,
						href: urlGenerator({
							address: '/(loggedIn)/users',
							searchParamsValue: { page: 0 }
						})
					},
					{
						label: 'Backups',
						active: pageIsBackup,
						icon: BackupIcon,
						href: urlGenerator({
							address: '/(loggedIn)/backup',
							searchParamsValue: { page: 0 }
						})
					},
					{
						label: 'Cron Jobs',
						active: pageIsCron,
						icon: CronIcon,
						href: urlGenerator({
							address: '/(loggedIn)/admin/cron',
							searchParamsValue: {}
						})
					},
					{
						label: 'Settings',
						active: pageIsSettings,
						icon: SettingsIcon,
						href: urlGenerator({ address: '/(loggedIn)/settings' })
					},
					...(data.dev
						? [
								{
									label: 'Dev',
									active: pageIsDev,
									icon: DevIcon,
									href: urlGenerator({ address: '/(loggedIn)/dev/bulkLoad' })
								}
							]
						: [])
				]
			: [],
		other: [
			{
				label: 'Files',
				active: pageIsFiles,
				icon: FileIcon,
				href: urlGenerator({
					address: '/(loggedIn)/files',
					searchParamsValue: {}
				})
			},
			{
				label: 'Reusable Filters',
				active: pageIsFilters,
				icon: ReusableFilterIcon,
				href: urlGenerator({
					address: '/(loggedIn)/filters',
					searchParamsValue: {}
				})
			},
			...(data.user
				? [
						{
							label: 'User',
							active: pageIsCurrentUser,
							icon: UserAccountIcon,
							href: urlGenerator({
								address: '/(loggedIn)/users/[id]',
								paramsValue: { id: data.user?.id }
							})
						}
					]
				: [])
		]
	});

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
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...newFilter,
						page: 0,
						pageSize: 10
					}
				}).url}
			updateFilter={(newFilter) =>
				urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: newFilter
				}).url}
			bind:shown={filterSelectionModalOpened}
		/>
		<div class="flex grow"></div>
		<DarkMode />
		<Button outline><MenuIcon /></Button>
		<Dropdown simple>
			<DropdownItem
				class="flex flex-row gap-2"
				href={urlGenerator({ address: '/(loggedIn)/files/create' }).url}
			>
				<FileIcon />Add File
			</DropdownItem>
			<DropdownItem class="flex flex-row gap-2" onclick={() => (filterSelectionModalOpened = true)}>
				Journals
			</DropdownItem>

			<DropdownItem class="flex flex-row gap-2"><ArrowLeftIcon />Config</DropdownItem>
			<Dropdown placement="left" simple>
				<!-- Linked Items -->
				<DropdownItem class="flex items-center justify-between">
					Linked Items<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
				</DropdownItem>
				<Dropdown placement="left-start" simple>
					{#each pageGroups.linkedItems as item}
						<DropdownItem href={item.href.url}>
							<div class="flex flex-row items-center gap-2">
								<item.icon />{item.label}
							</div>
						</DropdownItem>
					{/each}
				</Dropdown>

				<!-- Imports -->
				<DropdownItem class="flex items-center justify-between">
					Imports<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
				</DropdownItem>
				<Dropdown placement="left-start" simple>
					{#each pageGroups.imports as item}
						<DropdownItem href={item.href.url}>
							<div class="flex flex-row items-center gap-2">
								<item.icon />{item.label}
							</div>
						</DropdownItem>
					{/each}
				</Dropdown>

				<!-- LLM -->
				{#if pageGroups.llm.length > 0}
					<DropdownItem class="flex items-center justify-between">
						LLM<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
					</DropdownItem>
					<Dropdown placement="left-start" simple>
						{#each pageGroups.llm as item}
							<DropdownItem href={item.href.url}>
								<div class="flex flex-row items-center gap-2">
									<item.icon />{item.label}
								</div>
							</DropdownItem>
						{/each}
					</Dropdown>
				{/if}

				<!-- Database Queries -->
				{#if pageGroups.database.length > 0}
					<DropdownItem class="flex items-center justify-between">
						Database Queries<ChevronRightOutline
							class="text-primary-700 ms-2 h-6 w-6 dark:text-white"
						/>
					</DropdownItem>
					<Dropdown placement="left-start" simple>
						{#each pageGroups.database as item}
							<DropdownItem href={item.href.url}>
								<div class="flex flex-row items-center gap-2">
									<item.icon />{item.label}
								</div>
							</DropdownItem>
						{/each}
					</Dropdown>
				{/if}

				<!-- Logging -->
				<DropdownItem class="flex items-center justify-between">
					Logging<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
				</DropdownItem>
				<Dropdown placement="left-start" simple>
					{#each pageGroups.logging as item}
						<DropdownItem href={item.href.url}>
							<div class="flex flex-row items-center gap-2">
								<item.icon />{item.label}
							</div>
						</DropdownItem>
					{/each}
				</Dropdown>

				<!-- System Administration -->
				{#if pageGroups.systemAdmin.length > 0}
					<DropdownItem class="flex items-center justify-between">
						System Administration<ChevronRightOutline
							class="text-primary-700 ms-2 h-6 w-6 dark:text-white"
						/>
					</DropdownItem>
					<Dropdown placement="left-start" simple>
						{#each pageGroups.systemAdmin as item}
							<DropdownItem href={item.href.url}>
								<div class="flex flex-row items-center gap-2">
									<item.icon />{item.label}
								</div>
							</DropdownItem>
						{/each}
					</Dropdown>
				{/if}

				<!-- Other -->
				{#each pageGroups.other as item}
					<DropdownItem href={item.href.url}>
						<div class="flex flex-row items-center gap-2">
							<item.icon />{item.label}
						</div>
					</DropdownItem>
				{/each}
			</Dropdown>
			<DropdownDivider />
			<DropdownItem href={urlGenerator({ address: '/(loggedIn)/logout' }).url}>Logout</DropdownItem>
		</Dropdown>
	</div>

	<div class="hidden flex-row flex-wrap justify-center gap-2 pb-8 pt-4 md:flex">
		<Button href={urlGenerator({ address: '/(loggedIn)/files/create' }).url} outline size="xs">
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
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...newFilter,
						page: 0,
						pageSize: 10
					}
				}).url}
			updateFilter={(newFilter) =>
				urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: newFilter
				}).url}
			currentFilter={{
				page: 0,
				pageSize: 10,
				orderBy: [{ field: 'date', direction: 'desc' }]
			}}
		/>
		<Button outline>Config</Button>
		<Dropdown simple>
			<!-- Linked Items -->
			<DropdownItem class="flex items-center justify-between">
				Linked Items<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
			</DropdownItem>
			<Dropdown placement="right-start" simple>
				{#each pageGroups.linkedItems as item}
					{@const DisplayIcon = item.icon}
					<DropdownItem
						href={item.href.url}
						class={item.active ? 'bg-primary-600 text-primary-200' : ''}
					>
						<div class="flex flex-row items-center gap-2">
							<DisplayIcon />{item.label}
						</div>
					</DropdownItem>
				{/each}
			</Dropdown>

			<!-- Imports -->
			<DropdownItem class="flex items-center justify-between">
				Imports<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
			</DropdownItem>
			<Dropdown placement="right-start" simple>
				{#each pageGroups.imports as item}
					{@const DisplayIcon = item.icon}
					<DropdownItem
						href={item.href.url}
						class={item.active ? 'bg-primary-600 text-primary-200' : ''}
					>
						<div class="flex flex-row items-center gap-2">
							<DisplayIcon />{item.label}
						</div>
					</DropdownItem>
				{/each}
			</Dropdown>

			<!-- LLM -->
			{#if pageGroups.llm.length > 0}
				<DropdownItem class="flex items-center justify-between">
					LLM<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
				</DropdownItem>
				<Dropdown placement="right-start" simple>
					{#each pageGroups.llm as item}
						{@const DisplayIcon = item.icon}
						<DropdownItem
							href={item.href.url}
							class={item.active ? 'bg-primary-600 text-primary-200' : ''}
						>
							<div class="flex flex-row items-center gap-2">
								<DisplayIcon />{item.label}
							</div>
						</DropdownItem>
					{/each}
				</Dropdown>
			{/if}

			<!-- Database Queries -->
			{#if pageGroups.database.length > 0}
				<DropdownItem class="flex items-center justify-between">
					Database Queries<ChevronRightOutline
						class="text-primary-700 ms-2 h-6 w-6 dark:text-white"
					/>
				</DropdownItem>
				<Dropdown placement="right-start" simple>
					{#each pageGroups.database as item}
						{@const DisplayIcon = item.icon}
						<DropdownItem
							href={item.href.url}
							class={item.active ? 'bg-primary-600 text-primary-200' : ''}
						>
							<div class="flex flex-row items-center gap-2">
								<DisplayIcon />{item.label}
							</div>
						</DropdownItem>
					{/each}
				</Dropdown>
			{/if}

			<!-- Logging -->
			<DropdownItem class="flex items-center justify-between">
				Logging<ChevronRightOutline class="text-primary-700 ms-2 h-6 w-6 dark:text-white" />
			</DropdownItem>
			<Dropdown placement="right-start" simple>
				{#each pageGroups.logging as item}
					{@const DisplayIcon = item.icon}
					<DropdownItem
						href={item.href.url}
						class={item.active ? 'bg-primary-600 text-primary-200' : ''}
					>
						<div class="flex flex-row items-center gap-2">
							<DisplayIcon />{item.label}
						</div>
					</DropdownItem>
				{/each}
			</Dropdown>

			<!-- System Administration -->
			{#if pageGroups.systemAdmin.length > 0}
				<DropdownItem class="flex items-center justify-between">
					System Administration<ChevronRightOutline
						class="text-primary-700 ms-2 h-6 w-6 dark:text-white"
					/>
				</DropdownItem>
				<Dropdown placement="right-start" simple>
					{#each pageGroups.systemAdmin as item}
						{@const DisplayIcon = item.icon}
						<DropdownItem
							href={item.href.url}
							class={item.active ? 'bg-primary-600 text-primary-200' : ''}
						>
							<div class="flex flex-row items-center gap-2">
								<DisplayIcon />{item.label}
							</div>
						</DropdownItem>
					{/each}
				</Dropdown>
			{/if}

			<!-- Other -->
			{#each pageGroups.other as item}
				{@const DisplayIcon = item.icon}
				<DropdownItem
					href={item.href.url}
					class={item.active ? 'bg-primary-600 text-primary-200' : ''}
				>
					<div class="flex flex-row items-center gap-2">
						<DisplayIcon />{item.label}
					</div>
				</DropdownItem>
			{/each}

			<DropdownDivider />
			<DropdownItem href={urlGenerator({ address: '/(loggedIn)/logout' }).url}>Logout</DropdownItem>
		</Dropdown>
		<DarkMode />
	</div>
	{@render children()}
	<NotificationDisplay />
</div>
