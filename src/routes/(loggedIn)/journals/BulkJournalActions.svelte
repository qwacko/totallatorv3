<script lang="ts">
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultAllJournalFilter, type JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { P, ButtonGroup, Button } from 'flowbite-svelte';

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

	<P size="sm" weight="semibold" class="w-max whitespace-nowrap">
		All ({allCount})
	</P>
	<ButtonGroup>
		<Button
			color="light"
			href={urlGenerator({
				address: '/(loggedIn)/journals/bulkEdit',
				searchParamsValue: searchParams
					? { ...searchParams, pageSize: 100000, page: 0 }
					: searchParams
			}).url}
			disabled={allCount === 0}
		>
			<EditIcon />
		</Button>
		<Button
			color="light"
			href={urlGenerator({
				address: '/(loggedIn)/journals/clone',
				searchParamsValue: searchParams
					? { ...searchParams, pageSize: 100000, page: 0 }
					: searchParams
			}).url}
			disabled={allCount === 0}
		>
			<CloneIcon />
		</Button>
		<Button
			color="light"
			href={urlGenerator({
				address: '/(loggedIn)/journals/delete',
				searchParamsValue: searchParams
					? { ...searchParams, pageSize: 100000, page: 0 }
					: searchParams
			}).url}
			disabled={allCount === 0}
		>
			<DeleteIcon />
		</Button>
	</ButtonGroup>
</div>
