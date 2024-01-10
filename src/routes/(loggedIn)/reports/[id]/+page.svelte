<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ReportGridWrapper from '$lib/components/report/ReportGridWrapper.svelte';
	import ReportGridItem from '$lib/components/report/ReportGridItem.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { Badge, Button, Input } from 'flowbite-svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDownIcon.svelte';
	import ArrowUpIcon from '$lib/components/icons/ArrowUpIcon.svelte';
	import { reportLayoutStore } from './reportLayoutStore.js';

	export let data;

	let edit = false;

	$: reportData = reportLayoutStore(data.report);
	$: reportLayoutStringStore = reportData.reportLayoutStringStore;
</script>

<CustomHeader pageTitle="Report - {$reportData.title}" />

<PageLayout title={$reportData.title} size={$reportData.size}>
	<svelte:fragment slot="right">
		{#if edit}
			<Button color="red" on:click={() => (edit = false)} class="gap-2">
				<EditIcon />Editing
			</Button>
		{:else}
			<Button color="primary" outline on:click={() => (edit = true)}><EditIcon /></Button>
		{/if}
	</svelte:fragment>
	<RawDataModal data={data.report} dev={data.dev} />
	<RawDataModal data={$reportLayoutStringStore} dev={data.dev} />
	<ReportGridWrapper size="xl">
		{#each $reportData.reportElements as { cols, rows, title, id, order }}
			<ReportGridItem {cols} {rows} highlightOnHover={false} title={edit ? undefined : title}>
				<div class="flex h-full w-full flex-col gap-2">
					<div class="item-stretch flex flex-grow flex-row gap-2">
						<div class="flex flex-grow bg-blue-200">Data Goes Here</div>
						{#if edit}
							<div class="flex flex-col gap-2 self-center">
								<Button
									color="primary"
									size="xs"
									outline
									on:click={() => reportData.changeWidth(id, +1)}
								>
									+
								</Button>
								<Badge color="blue">{cols}</Badge>
								<Button
									color="primary"
									size="xs"
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
								outline
								on:click={() => reportData.changeHeight(id, +1)}
							>
								+
							</Button>
							<Badge color="blue">{rows}</Badge>
							<Button
								color="primary"
								size="xs"
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
						<Input tag="h3" class="mr-2" bind:value={title} />
					{/if}
				</svelte:fragment>
				<svelte:fragment slot="titleRight">
					{#if edit}
						<div class="flex flex-row gap-2">
							<Button color="primary" size="xs" outline on:click={() => reportData.moveUp(id)}>
								<ArrowUpIcon />
							</Button>
							<Badge color="blue">{order}</Badge>
							<Button color="primary" size="xs" outline on:click={() => reportData.moveDown(id)}>
								<ArrowDownIcon />
							</Button>
						</div>
					{/if}
				</svelte:fragment>
			</ReportGridItem>
		{/each}
	</ReportGridWrapper>
</PageLayout>
