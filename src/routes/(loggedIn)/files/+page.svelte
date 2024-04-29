<script lang="ts">
	import { Button, ButtonGroup, Input, Badge, Popover } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes';
	import { goto, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { fileColumnsStore } from '$lib/stores/columnDisplayStores';
	import { enhance } from '$app/forms';
	import ImageIcon from '$lib/components/icons/ImageIcon.svelte';
	import DownloadIcon from '$lib/components/icons/DownloadIcon.svelte';
	import { fileSizeToText } from './fileSizeToText';
	import { fileTypeToText } from '$lib/schema/enum/fileTypeEnum.js';
	import { fileReasonToText } from '$lib/schema/enum/fileReasonEnum.js';
	import FileThumbnail from '$lib/components/FileThumbnail.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import AccountIcon from '$lib/components/icons/AccountIcon.svelte';
	import BillIcon from '$lib/components/icons/BillIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import LabelIcon from '$lib/components/icons/LabelIcon.svelte';
	import BudgetIcon from '$lib/components/icons/BudgetIcon.svelte';
	import TagIcon from '$lib/components/icons/TagIcon.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/files', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/files',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});

	let filterOpened = false;

	let checkingFiles = false;

	onNavigate(() => {
		filterOpened = false;
	});
</script>

<CustomHeader
	pageTitle="Files"
	filterText={data.filterText}
	pageNumber={data.files.page}
	numPages={data.files.pageCount}
/>

<PageLayout title="Files" size="xl">
	<svelte:fragment slot="right">
		<form
			method="post"
			use:enhance={customEnhance({
				updateLoading: (loading) => (checkingFiles = loading)
			})}
			action="?/checkFiles"
		>
			<ActionButton
				color="primary"
				outline
				type="submit"
				message="Check Files"
				loadingMessage="Checking..."
				loading={checkingFiles}
			/>
		</form>
		<Button color="light" outline href={urlGenerator({ address: '/(loggedIn)/files/create' }).url}>
			Create
		</Button>
	</svelte:fragment>
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.files.page,
				count: data.files.count,
				perPage: data.files.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Files Found"
			data={data.files.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Files"
			bind:numberRows={$urlStore.searchParams.pageSize}
			bind:filterOpened
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'createdAt',
					title: 'Created',
					rowToDisplay: (row) => row.createdAt.toISOString().slice(0, 10),
					sortKey: 'createdAt',
					showTitleOnMobile: true
				},
				{
					id: 'fileExists',
					title: 'Exists',
					sortKey: 'exists',
					showTitleOnMobile: true
				},
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title,
					sortKey: 'title'
				},
				{
					id: 'thumbnailFilename',
					title: 'Thumbnail'
				},
				{
					id: 'originalFilename',
					title: 'Filename',
					rowToDisplay: (row) => row.originalFilename,
					sortKey: 'originalFilename',
					showTitleOnMobile: true
				},
				{
					id: 'type',
					title: 'File Type',
					sortKey: 'type',
					showTitleOnMobile: true
				},
				{
					id: 'links',
					title: 'Linked'
				},
				{
					id: 'reason',
					title: 'Reason',
					sortKey: 'reason',
					showTitleOnMobile: true
				},
				{
					id: 'size',
					title: 'File Size',
					rowToDisplay: (row) => fileSizeToText(row.size),
					sortKey: 'size',
					showTitleOnMobile: true
				}
			]}
			bind:shownColumns={$fileColumnsStore}
		>
			<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/files/[id]/delete',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const downloadURL = urlGenerator({
						address: '/(loggedIn)/files/[id]/[filename]',
						paramsValue: { id: currentRow.id, filename: currentRow.originalFilename }
					}).url}
					{@const infoURL = urlGenerator({
						address: '/(loggedIn)/files/[id]',
						paramsValue: { id: currentRow.id }
					}).url}
					<div class="flex flex-row justify-center">
						<form method="POST" action="?/update" use:enhance>
							<input type="hidden" name="id" value={currentRow.id} />
							<ButtonGroup>
								<Button href={infoURL} class="p-2" outline color="primary">
									<EditIcon height={15} width={15} />
								</Button>
								<Button href={downloadURL} class="p-2" outline color="blue">
									<DownloadIcon height={15} width={15} />
								</Button>
								<Button href={deleteURL} class="p-2" outline color="red">
									<DeleteIcon height={15} width={15} />
								</Button>
								<RawDataModal data={currentRow} title="Raw Label Data" dev={data.dev} />
							</ButtonGroup>
						</form>
					</div>
				{:else if currentColumn.id === 'thumbnailFilename'}
					{#if currentRow.thumbnailFilename}
						<ImageIcon id="b1{currentRow.id}" />
						<Popover title={currentRow.originalFilename} triggeredBy="#b1{currentRow.id}">
							<FileThumbnail item={currentRow} />
						</Popover>
					{/if}
				{:else if currentColumn.id === 'type'}
					<Badge>{fileTypeToText(currentRow.type)}</Badge>
				{:else if currentColumn.id === 'fileExists'}
					{#if !currentRow.fileExists}
						<Badge color="red">Missing</Badge>
					{:else}
						<Badge color="green">Y</Badge>
					{/if}
				{:else if currentColumn.id === 'links'}
					<div class="flex flex-col items-stretch gap-1">
						{#if currentRow.accountTitle}
							<Badge
								href={currentRow.accountId
									? urlGenerator({
											address: '/(loggedIn)/accounts/bulkEdit',
											searchParamsValue: { id: currentRow.accountId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<AccountIcon />{currentRow.accountTitle}
							</Badge>
						{/if}
						{#if currentRow.labelTitle}
							<Badge
								href={currentRow.labelId
									? urlGenerator({
											address: '/(loggedIn)/labels/[id]',
											paramsValue: { id: currentRow.labelId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<LabelIcon />{currentRow.labelTitle}
							</Badge>
						{/if}
						{#if currentRow.billTitle}
							<Badge
								href={currentRow.billId
									? urlGenerator({
											address: '/(loggedIn)/bills/[id]',
											paramsValue: { id: currentRow.billId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<BillIcon />{currentRow.billTitle}
							</Badge>
						{/if}
						{#if currentRow.budgetTitle}
							<Badge
								href={currentRow.budgetId
									? urlGenerator({
											address: '/(loggedIn)/budgets/[id]',
											paramsValue: { id: currentRow.budgetId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<BudgetIcon />{currentRow.budgetTitle}
							</Badge>
						{/if}
						{#if currentRow.categoryTitle}
							<Badge
								href={currentRow.categoryId
									? urlGenerator({
											address: '/(loggedIn)/categories/[id]',
											paramsValue: { id: currentRow.categoryId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<CategoryIcon />{currentRow.categoryTitle}
							</Badge>
						{/if}
						{#if currentRow.tagTitle}
							<Badge
								href={currentRow.tagId
									? urlGenerator({
											address: '/(loggedIn)/tags/[id]',
											paramsValue: { id: currentRow.tagId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<TagIcon />{currentRow.tagTitle}
							</Badge>
						{/if}
						{#if currentRow.journals.length > 0}
							{#each currentRow.journals as journal}
								<Badge
									href={currentRow.transactionId
										? urlGenerator({
												address: '/(loggedIn)/journals',
												searchParamsValue: {
													transactionIdArray: [currentRow.transactionId],
													pageSize: 10,
													page: 0,
													orderBy: [{ field: 'date', direction: 'desc' }]
												}
											}).url
										: undefined}
									class="flex flex-row gap-2"
								>
									<JournalEntryIcon />{journal.dateText} - {journal.accountTitle} - {journal.description}
								</Badge>
							{/each}
						{/if}
					</div>
				{:else if currentColumn.id === 'reason'}
					<Badge>{fileReasonToText(currentRow.reason)}</Badge>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filter">
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.textFilter}
							placeholder="Filter..."
							class="flex flex-grow"
						/>
					{/if}
				</div>
			</svelte:fragment>
		</CustomTable>{/if}
</PageLayout>
