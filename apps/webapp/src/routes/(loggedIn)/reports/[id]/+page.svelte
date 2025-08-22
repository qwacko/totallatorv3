<script lang="ts">
	import { Badge, Button, Heading, Input, Select, Spinner } from 'flowbite-svelte';

	import { type DateSpanEnumType, getDateSpanDropdown } from '@totallator/shared';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDownIcon.svelte';
	import ArrowUpIcon from '$lib/components/icons/ArrowUpIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import ReportGridItem from '$lib/components/report/ReportGridItem.svelte';
	import ReportGridWrapper from '$lib/components/report/ReportGridWrapper.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';

	import ReportElementDisplay from './ReportElementDisplay.svelte';
	import ReportFilterModal from './ReportFilterModal.svelte';
	import { reportLayoutStore } from './reportLayoutStore.js';

	const { data } = $props();

	let edit = $state(false);
	let saving = $state(false);

	const urlInfo = pageInfo('/(loggedIn)/reports/[id]', () => page);

	const reportData = $derived(reportLayoutStore(data.report));
	const reportLayoutStringStore = $derived(reportData.reportLayoutStringStore);

	const updateDateSpan = (event: Event) => {
		const targetDateSpan = (event.target as HTMLSelectElement).value as DateSpanEnumType;
		if (urlInfo.current.searchParams) {
			urlInfo.current.searchParams.dateSpan = targetDateSpan;
		} else {
			urlInfo.current.searchParams = { dateSpan: targetDateSpan };
		}
	};
</script>

<CustomHeader pageTitle="Report - {$reportData.title}" />

<PageLayout title={$reportData.title} size={$reportData.size}>
	{#snippet slotRight()}
		{#if edit}
			<Button
				color="red"
				onclick={() => {
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
				onclick={() => reportData.addElement()}
			>
				<PlusIcon />Add Element
			</Button>
		{:else}
			{#if data.report.filter}
				<div class="flex self-center text-gray-400">
					{data.report.filter.filterText}
				</div>
			{/if}
			<ReportFilterModal filter={data.report.filter?.filter} />
			<div class="flex">
				<Select
					value={data.dateSpan}
					items={getDateSpanDropdown()}
					onchange={updateDateSpan}
					placeholder="Time Span..."
				/>
			</div>
			<Button color="primary" outline onclick={() => (edit = true)}><EditIcon /></Button>
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
	{/snippet}

	<RawDataModal data={data.report} dev={data.dev} />
	<RawDataModal data={$reportLayoutStringStore} dev={data.dev} />
	<ReportGridWrapper size="xl">
		{#each $reportData.reportElements as { cols, rows, title, id, order }, index}
			<ReportGridItem {cols} {rows} highlightOnHover={false}>
				<div class="flex h-full w-full flex-col gap-2">
					<div class="item-stretch flex grow flex-row gap-2">
						<div class="flex grow place-content-center content-center self-stretch">
							<ReportElementDisplay {id} data={data.report} />
						</div>
						{#if edit}
							<div class="flex flex-col gap-2 self-center">
								<Button
									color="primary"
									size="xs"
									class="p-1"
									outline
									onclick={() => reportData.changeWidth(id, +1)}
								>
									+
								</Button>
								<Badge color="blue">{cols}</Badge>
								<Button
									color="primary"
									size="xs"
									class="p-1"
									outline
									onclick={() => reportData.changeWidth(id, -1)}
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
								onclick={() => reportData.changeHeight(id, +1)}
							>
								+
							</Button>
							<Badge color="blue">{rows}</Badge>
							<Button
								color="primary"
								size="xs"
								class="p-1"
								outline
								onclick={() => reportData.changeHeight(id, -1)}
							>
								-
							</Button>
						</div>
					{/if}
				</div>

				{#snippet slotTitleLeft()}
					{#if edit && $reportData.reportElements[index].title}
						<Input class="mr-2" bind:value={$reportData.reportElements[index].title} />
					{:else if title}
						<Heading tag="h4" class="mr-2">{title}</Heading>
					{/if}
				{/snippet}
				{#snippet slotTitleRight()}
					{#if edit}
						<div class="flex flex-row gap-2">
							<Button
								color="primary"
								size="xs"
								class="p-1"
								outline
								onclick={() => reportData.moveUp(id)}
							>
								<ArrowUpIcon />
							</Button>
							<Badge color="blue">{order}</Badge>
							<Button
								color="primary"
								size="xs"
								class="p-1"
								outline
								onclick={() => reportData.moveDown(id)}
							>
								<ArrowDownIcon />
							</Button>
							<Button
								color="red"
								size="xs"
								class="h-full p-1"
								onclick={() => reportData.removeElement(id)}
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
				{/snippet}
			</ReportGridItem>
		{/each}
	</ReportGridWrapper>
</PageLayout>
