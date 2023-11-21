<script lang="ts">
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import {
		defaultAllJournalFilter,
		defaultJournalFilter,
		type JournalFilterSchemaType
	} from '$lib/schema/journalSchema';
	import { P, ButtonGroup, Button, Dropdown, DropdownItem } from 'flowbite-svelte';

	export let selectedIds: string[];
	export let searchParams: JournalFilterSchemaType | undefined;
	export let allCount: number;
</script>

<div class="flex flex-row gap-2 items-center">
	<P size="sm" weight="semibold" class="w-max whitespace-nowrap">
		Selected ({selectedIds.length})
	</P>
	<ButtonGroup>
		<Button
			class="p-2"
			color="light"
			href={urlGenerator({
				address: '/(loggedIn)/journals/bulkEdit',
				searchParamsValue: {
					idArray: selectedIds,
					...defaultAllJournalFilter()
				}
			}).url}
			disabled={selectedIds.length === 0}
		>
			<EditIcon />
		</Button>
		<Button
			class="p-2"
			color="light"
			href={urlGenerator({
				address: '/(loggedIn)/journals/clone',
				searchParamsValue: {
					idArray: selectedIds,
					...defaultAllJournalFilter()
				}
			}).url}
			disabled={selectedIds.length === 0}
		>
			<CloneIcon />
		</Button>
		<Button
			class="p-2"
			color="light"
			href={urlGenerator({
				address: '/(loggedIn)/journals/delete',
				searchParamsValue: {
					idArray: selectedIds,
					...defaultAllJournalFilter()
				}
			}).url}
			disabled={selectedIds.length === 0}
		>
			<DeleteIcon />
		</Button>
		<Button
			class="p-2"
			color="light"
			href={urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: {
					idArray: selectedIds,
					...defaultAllJournalFilter(),
					account: {}
				}
			}).url}
			disabled={selectedIds.length === 0}
		>
			<EyeIcon />
		</Button>
	</ButtonGroup>
	<Button outline color="light" size="xs">All Journal Actions ({allCount})</Button>
	<Dropdown>
		<DropdownItem>
			<div class="flex flex-row gap-1 items-center justify-between">All<ArrowRightIcon /></div>
		</DropdownItem>
		<Dropdown>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/bulkEdit',
					searchParamsValue: searchParams
						? { ...searchParams, pageSize: 100000, page: 0 }
						: undefined
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><EditIcon />Edit</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/clone',
					searchParamsValue: searchParams
						? { ...searchParams, pageSize: 100000, page: 0 }
						: undefined
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><CloneIcon />Clone</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/delete',
					searchParamsValue: searchParams
						? { ...searchParams, pageSize: 100000, page: 0 }
						: undefined
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><DeleteIcon />Delete</div>
			</DropdownItem>
		</Dropdown>
		<DropdownItem>
			<div class="flex flex-row gap-1 items-center justify-between">
				Incomplete<ArrowRightIcon />
			</div>
		</DropdownItem>
		<Dropdown>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/bulkEdit',
					searchParamsValue: searchParams
						? { ...searchParams, complete: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), complete: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><EditIcon />Edit</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/clone',
					searchParamsValue: searchParams
						? { ...searchParams, complete: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), complete: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><CloneIcon />Clone</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/delete',
					searchParamsValue: searchParams
						? { ...searchParams, complete: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), complete: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><DeleteIcon />Delete</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: searchParams
						? { ...searchParams, complete: false }
						: { ...defaultJournalFilter(), complete: false }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><FilterIcon />View</div>
			</DropdownItem>
		</Dropdown>
		<DropdownItem>
			<div class="flex flex-row gap-1 items-center justify-between">
				Data Unchecked<ArrowRightIcon />
			</div>
		</DropdownItem>
		<Dropdown>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/bulkEdit',
					searchParamsValue: searchParams
						? { ...searchParams, dataChecked: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), dataChecked: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><EditIcon />Edit</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/clone',
					searchParamsValue: searchParams
						? { ...searchParams, dataChecked: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), dataChecked: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><CloneIcon />Clone</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/delete',
					searchParamsValue: searchParams
						? { ...searchParams, dataChecked: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), dataChecked: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><DeleteIcon />Delete</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: searchParams
						? { ...searchParams, dataChecked: false }
						: { ...defaultJournalFilter(), dataChecked: false }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><FilterIcon />View</div>
			</DropdownItem>
		</Dropdown>
		<DropdownItem>
			<div class="flex flex-row gap-1 items-center justify-between">
				Unreconciled<ArrowRightIcon />
			</div>
		</DropdownItem>
		<Dropdown>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/bulkEdit',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), reconciled: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><EditIcon />Edit</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/clone',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), reconciled: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><CloneIcon />Clone</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/delete',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false, pageSize: 100000, page: 0 }
						: { ...defaultAllJournalFilter(), reconciled: false, pageSize: 100000, page: 0 }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><DeleteIcon />Delete</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false }
						: { ...defaultJournalFilter(), reconciled: false }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><FilterIcon />View</div>
			</DropdownItem>
		</Dropdown>
		<DropdownItem>
			<div class="flex flex-row gap-2 items-center justify-between">
				Unchecked and Incomplete<ArrowRightIcon />
			</div>
		</DropdownItem>
		<Dropdown>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/bulkEdit',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false, dataChecked: false, pageSize: 100000, page: 0 }
						: {
								...defaultAllJournalFilter(),
								reconciled: false,
								dataChecked: false,
								pageSize: 100000,
								page: 0
						  }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><EditIcon />Edit</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/clone',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false, dataChecked: false, pageSize: 100000, page: 0 }
						: {
								...defaultAllJournalFilter(),
								reconciled: false,
								dataChecked: false,
								pageSize: 100000,
								page: 0
						  }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><CloneIcon />Clone</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals/delete',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false, dataChecked: false, pageSize: 100000, page: 0 }
						: {
								...defaultAllJournalFilter(),
								reconciled: false,
								dataChecked: false,
								pageSize: 100000,
								page: 0
						  }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><DeleteIcon />Delete</div>
			</DropdownItem>
			<DropdownItem
				href={urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: searchParams
						? { ...searchParams, reconciled: false, dataChecked: false }
						: { ...defaultJournalFilter(), reconciled: false, dataChecked: false }
				}).url}
			>
				<div class="flex flex-row gap-1 items-center"><FilterIcon />View</div>
			</DropdownItem>
		</Dropdown>
	</Dropdown>
</div>
