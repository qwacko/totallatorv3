<script lang="ts">
	import { page } from '$app/stores';
	import AccountIcon from '$lib/components/icons/AccountIcon.svelte';
	import BillIcon from '$lib/components/icons/BillIcon.svelte';
	import BudgetIcon from '$lib/components/icons/BudgetIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import LabelIcon from '$lib/components/icons/LabelIcon.svelte';
	import TagIcon from '$lib/components/icons/TagIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { Button, Tooltip } from 'flowbite-svelte';
	import BulkCreateDisplay from './dev/bulkLoad/BulkCreateDisplay.svelte';
	import DevIcon from '$lib/components/icons/DevIcon.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';

	export let data;

	$: pageIsBills = $page.route.id?.startsWith('/(loggedIn)/bills');
	$: pageIsTags = $page.route.id?.startsWith('/(loggedIn)/tags');
	$: pageIsLabels = $page.route.id?.startsWith('/(loggedIn)/labels');
	$: pageIsBudgets = $page.route.id?.startsWith('/(loggedIn)/budgets');
	$: pageIsCategories = $page.route.id?.startsWith('/(loggedIn)/categories');
	$: pageIsJournalEntries = $page.route.id?.startsWith('/(loggedIn)/journal-entries');
	$: pageIsAccounts = $page.route.id?.startsWith('/(loggedIn)/accounts');
	$: pageIsDev = $page.route.id?.startsWith('/(loggedIn)/dev');

	$: pageMap = [
		{
			label: 'Journal Entries',
			active: pageIsJournalEntries,
			icon: JournalEntryIcon,
			href: urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultJournalFilter
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
</script>

<div class="flex flex-col justify-stretch p-2">
	<div class="flex flex-row justify-center gap-2 pb-8 pt-4">
		{#each pageMap as currentPage}
			<Button
				id={currentPage.label}
				class="flex border-0"
				outline={!currentPage.active}
				href={currentPage.href.url}
			>
				<svelte:component this={currentPage.icon} />
			</Button>
			<Tooltip triggeredBy="[id^='{currentPage.label}']">{currentPage.label}</Tooltip>
		{/each}
	</div>
	<slot />
</div>
