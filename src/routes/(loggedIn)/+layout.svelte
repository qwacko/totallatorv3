<script lang="ts">
	import { page } from '$app/stores';
	import AccountIcon from '$lib/components/icons/AccountIcon.svelte';
	import BillIcon from '$lib/components/icons/BillIcon.svelte';
	import BudgetIcon from '$lib/components/icons/BudgetIcon.svelte';
	import BackupIcon from '$lib/components/icons/BackupIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import LabelIcon from '$lib/components/icons/LabelIcon.svelte';
	import ReusableFilterIcon from '$lib/components/icons/ReusableFilterIcon.svelte';
	import UsersIcon from '$lib/components/icons/UsersIcon.svelte';
	import UserAccountIcon from '$lib/components/icons/UserAccountIcon.svelte';
	import TagIcon from '$lib/components/icons/TagIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import DevIcon from '$lib/components/icons/DevIcon.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import ImportIcon from '$lib/components/icons/ImportIcon.svelte';
	import FilterDropdown from '$lib/components/FilterDropdown.svelte';
	import ReportDropdown from '$lib/components/report/ReportDropdown.svelte';
	import NotificationDisplay from '$lib/components/NotificationDisplay.svelte';
	import { userInfoUpdateStore } from '$lib/stores/userInfoStore.js';

	export let data;

	$: $userInfoUpdateStore = data.user;

	$: pageIsBills = $page.route.id?.startsWith('/(loggedIn)/bills');
	$: pageIsTags = $page.route.id?.startsWith('/(loggedIn)/tags');
	$: pageIsLabels = $page.route.id?.startsWith('/(loggedIn)/labels');
	$: pageIsBudgets = $page.route.id?.startsWith('/(loggedIn)/budgets');
	$: pageIsCategories = $page.route.id?.startsWith('/(loggedIn)/categories');
	$: pageIsJournalEntries = $page.route.id?.startsWith('/(loggedIn)/journal-entries');
	$: pageIsAccounts = $page.route.id?.startsWith('/(loggedIn)/accounts');
	$: pageIsDev = $page.route.id?.startsWith('/(loggedIn)/dev');
	$: pageIsImportMapping = $page.route.id?.startsWith('/(loggedIn)/importMapping');
	$: pageIsImport = $page.route.id?.startsWith('/(loggedIn)/import') && !pageIsImportMapping;
	$: pageIsBackup = $page.route.id?.startsWith('/(loggedIn)/backup');
	$: pageIsCurrentUser = data.user?.id
		? $page.url.toString().includes(data.user.id)
		: false;
	$: pageIsUsers = $page.route.id?.startsWith('/(loggedIn)/users') && !pageIsCurrentUser;
	$: pageIsFilters = $page.route.id?.startsWith('/(loggedIn)/filters');

	$: pageMap = [
		{
			label: 'Journal Entries',
			active: pageIsJournalEntries,
			icon: JournalEntryIcon,
			href: urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultJournalFilter()
			})
		},
		{
			label: 'Bills',
			active: pageIsBills,
			icon: BillIcon,
			href: urlGenerator({ address: '/(loggedIn)/bills', searchParamsValue: {} })
		},
		{
			label: 'Tags',
			active: pageIsTags,
			icon: TagIcon,
			href: urlGenerator({ address: '/(loggedIn)/tags', searchParamsValue: {} })
		},
		{
			label: 'Labels',
			active: pageIsLabels,
			icon: LabelIcon,
			href: urlGenerator({ address: '/(loggedIn)/labels', searchParamsValue: {} })
		},
		{
			label: 'Budgets',
			active: pageIsBudgets,
			icon: BudgetIcon,
			href: urlGenerator({ address: '/(loggedIn)/budgets', searchParamsValue: {} })
		},
		{
			label: 'Categories',
			active: pageIsCategories,
			icon: CategoryIcon,
			href: urlGenerator({ address: '/(loggedIn)/categories', searchParamsValue: {} })
		},
		{
			label: 'Accounts',
			active: pageIsAccounts,
			icon: AccountIcon,
			href: urlGenerator({ address: '/(loggedIn)/accounts', searchParamsValue: {} })
		},
		{
			label: 'Reusable Filters',
			active: pageIsFilters,
			icon: ReusableFilterIcon,
			href: urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} })
		},
		{
			label: 'Import',
			active: pageIsImport,
			icon: ImportIcon,
			href: urlGenerator({ address: '/(loggedIn)/import' })
		},
		{
			label: 'Import Mapping',
			active: pageIsImportMapping,
			icon: ImportIcon,
			href: urlGenerator({ address: '/(loggedIn)/importMapping', searchParamsValue: {} })
		},
		{
			label: 'Backup',
			active: pageIsBackup,
			icon: BackupIcon,
			href: urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 0 } })
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
			: []),
		...(data.user?.admin
			? [
					{
						label: 'Users',
						active: pageIsUsers,
						icon: UsersIcon,
						href: urlGenerator({ address: '/(loggedIn)/users', searchParamsValue: { page: 0 } })
					}
				]
			: []),
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
	];

	$: pageMapWithoutJournals = pageMap.filter((page) => page.label !== 'Journal Entries');
</script>

<div class="flex flex-col justify-stretch p-2">
	<div class="flex flex-row flex-wrap justify-center gap-2 pb-8 pt-4">
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
			currentFilter={{ page: 0, pageSize: 10, orderBy: [{ field: 'date', direction: 'desc' }] }}
		/>
		<Button outline color="light">Config</Button>
		<Dropdown>
			{#each pageMapWithoutJournals as currentPage}
				<DropdownItem href={currentPage.href.url}>
					<div class="flex flex-row items-center gap-2">
						<svelte:component this={currentPage.icon} />{currentPage.label}
					</div>
				</DropdownItem>
			{/each}
		</Dropdown>
		<!-- {#each pageMap as currentPage}
			<Button
				id={currentPage.label}
				class="flex border-0"
				outline={!currentPage.active}
				href={currentPage.href.url}
			>
				<svelte:component this={currentPage.icon} />
			</Button>
			<Tooltip triggeredBy="[id^='{currentPage.label}']">{currentPage.label}</Tooltip>
		{/each} -->
	</div>
	<slot />
	<NotificationDisplay />
</div>
