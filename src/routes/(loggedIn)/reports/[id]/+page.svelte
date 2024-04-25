<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ReportGridWrapper from '$lib/components/report/ReportGridWrapper.svelte';
	import ReportGridItem from '$lib/components/report/ReportGridItem.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { Badge, Button, Heading, Input, Select, Spinner } from 'flowbite-svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDownIcon.svelte';
	import ArrowUpIcon from '$lib/components/icons/ArrowUpIcon.svelte';
	import { reportLayoutStore } from './reportLayoutStore.js';
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import ReportElementDisplay from './ReportElementDisplay.svelte';
	import { pageInfoStore, urlGenerator, pageInfo } from '$lib/routes.js';
	import { getDateSpanDropdown, type DateSpanEnumType } from '$lib/schema/dateSpanSchema.js';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import ReportFilterModal from './ReportFilterModal.svelte';

	export let data;

	let edit = false;
	let saving = false;

	$: urlInfo = pageInfo('/(loggedIn)/accounts', $page);
	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/reports/[id]',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});

	$: reportData = reportLayoutStore(data.report);
	$: reportLayoutStringStore = reportData.reportLayoutStringStore;

	const updateDateSpan = (event: Event) => {
		const targetDateSpan = (event.target as HTMLSelectElement).value as DateSpanEnumType;
		if ($urlStore.searchParams) {
			$urlStore.searchParams.dateSpan = targetDateSpan;
		} else {
			$urlStore.searchParams = { dateSpan: targetDateSpan };
		}
	};
</script>

<CustomHeader pageTitle="Report - {$reportData.title}" />

<PageLayout title={$reportData.title} size={$reportData.size}>
	<svelte:fragment slot="right">
		{#if edit}
			<Button
				color="red"
				on:click={() => {
					reportData.reset();
					edit = false;
				}}
				class="gap-2"
			>
				<EditIcon />Cancel Modifications
			</Button>
			<form
				action="?/updateLayout"
				method="post"
				use:enhance={({ formElement, formData, action, cancel }) => {
					saving = true;
					return async ({ result }) => {
						// `result` is an `ActionResult` object
						if (result.type === 'redirect') {
							edit = false;
							saving = false;
							goto(result.location);
						} else {
							await applyAction(result);
							edit = false;
							saving = false;
						}
					};
				}}
			>
				<input type="hidden" name="id" value={$reportData.id} />
				<input type="hidden" name="reportElements" value={$reportLayoutStringStore} />
				<Button
					color="primary"
					type="submit"
					class="flex flex-row justify-center gap-1"
					disabled={saving}
				>
					{#if saving}
						<Spinner size="5" />Saving
					{:else}
						Save Layout
					{/if}
				</Button>
			</form>
			<Button
				color="blue"
				type="submit"
				class="flex flex-row justify-center gap-1"
				on:click={() => reportData.addElement()}
			>
				<PlusIcon />Add Element
			</Button>
		{:else}
			{#if data.report.filter}
				<div class="flex self-center text-gray-400">
					{data.report.filter.filterText}
				</div>
			{/if}
			<ReportFilterModal
				filter={data.report.filter?.filter}
			/>
			<div class="flex">
				<Select
					value={data.dateSpan}
					items={getDateSpanDropdown()}
					on:change={updateDateSpan}
					placeholder="Time Span..."
				/>
			</div>
			<Button color="primary" outline on:click={() => (edit = true)}><EditIcon /></Button>
			<Button
				color="red"
				outline
				href={urlGenerator({
					address: '/(loggedIn)/reports/[id]/delete',
					paramsValue: { id: $reportData.id }
				}).url}
			>
				<DeleteIcon />
			</Button>
		{/if}
	</svelte:fragment>

	<RawDataModal data={data.report} dev={data.dev} />
	<RawDataModal data={$reportLayoutStringStore} dev={data.dev} />
	<ReportGridWrapper size="xl">
		{#each $reportData.reportElements as { cols, rows, title, id, order }}
			<ReportGridItem {cols} {rows} highlightOnHover={false}>
				<div class="flex h-full w-full flex-col gap-2">
					<div class="item-stretch flex flex-grow flex-row gap-2">
						<div class="flex flex-grow place-content-center content-center self-stretch">
							<ReportElementDisplay {id} data={data.report} />
						</div>
						{#if edit}
							<div class="flex flex-col gap-2 self-center">
								<Button
									color="primary"
									size="xs"
									class="p-1"
									outline
									on:click={() => reportData.changeWidth(id, +1)}
								>
									+
								</Button>
								<Badge color="blue">{cols}</Badge>
								<Button
									color="primary"
									size="xs"
									class="p-1"
									outline
									on:click={() => reportData.changeWidth(id, -1)}
								>
									-
								</Button>
							</div>
						{/if}
					</div>
					{#if edit}
						<div class="flex flex-row gap-2 self-center">
							<Button
								color="primary"
								size="xs"
								class="p-1"
								outline
								on:click={() => reportData.changeHeight(id, +1)}
							>
								+
							</Button>
							<Badge color="blue">{rows}</Badge>
							<Button
								color="primary"
								size="xs"
								class="p-1"
								outline
								on:click={() => reportData.changeHeight(id, -1)}
							>
								-
							</Button>
						</div>
					{/if}
				</div>

				<svelte:fragment slot="titleLeft">
					{#if edit}
						<Input tag="h4" class="mr-2" bind:value={title} />
					{:else if title}
						<Heading tag="h4" class="mr-2">{title}</Heading>
					{/if}
				</svelte:fragment>
				<svelte:fragment slot="titleRight">
					{#if edit}
						<div class="flex flex-row gap-2">
							<Button
								color="primary"
								size="xs"
								class="p-1"
								outline
								on:click={() => reportData.moveUp(id)}
							>
								<ArrowUpIcon />
							</Button>
							<Badge color="blue">{order}</Badge>
							<Button
								color="primary"
								size="xs"
								class="p-1"
								outline
								on:click={() => reportData.moveDown(id)}
							>
								<ArrowDownIcon />
							</Button>
							<Button
								color="red"
								size="xs"
								class="h-full p-1"
								on:click={() => reportData.removeElement(id)}
							>
								<DeleteIcon />
							</Button>
						</div>
					{:else}
						<a
							href={urlGenerator({
								address: '/(loggedIn)/reports/element/[id]',
								paramsValue: { id }
							}).url}
						>
							<EditIcon />
						</a>
					{/if}
				</svelte:fragment>
			</ReportGridItem>
		{/each}
	</ReportGridWrapper>
</PageLayout>
