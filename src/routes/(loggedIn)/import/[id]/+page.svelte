<script lang="ts">
	import { enhance } from '$app/forms';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { Badge, Button, Card, Spinner } from 'flowbite-svelte';

	export let data;
</script>

<PageLayout subtitle={data.info.importInfo.title} title="Import Detail">
	{#await data.streaming.data}
		<Badge color="blue">
			<div class="flex flex-row gap-2 items-center p-4"><Spinner />Loading / Processing...</div>
		</Badge>
	{:then importData}
		{#if !importData.detail}
			<Badge color="red">Unknown Data Load Error</Badge>
		{:else}
			<div class="flex self-center flex-row gap-1">
				<i>Last Modification :</i>
				{importData.detail.updatedAt.toISOString().slice(0, 19)}
			</div>
			<div class="flex self-center flex-row gap-1">
				{#if !importData.detail.complete}
					<form method="post" action="?/reprocess" use:enhance class="flex self-center">
						<Button color="blue" type="submit">Reprocess</Button>
					</form>
				{/if}
			</div>
			{#if importData.detail.processed && !importData.detail.error}
				<Badge color="green">Processed</Badge>
			{/if}
			{#if importData.detail.error}
				<Badge color="red">
					<div class="flex flex-col gap-2 p-4">
						File Import Error
						<pre>{JSON.stringify(importData.detail.errorInfo, null, 2)}</pre>
					</div>
				</Badge>
			{:else if importData.type === 'transaction'}
				{@const errorCount = importData.detail.importDetails.filter((d) => d.isError).length}
				{@const successCount = importData.detail.importDetails.filter((d) => !d.isError).length}
				<div class="self-center flex flex-row gap-2">
					<Badge color="green">Success: {successCount}</Badge>
					<Badge color="red">Error: {errorCount}</Badge>
					<RawDataModal data={importData.detail} dev={data.dev} buttonText="Import Data" outline />
				</div>
				<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
					{#each importData.detail.importDetails as currentImportDetail, i}
						{#if currentImportDetail.isError}
							<Card size="xl" padding="md" class="flex flex-col gap-2" color="red">
								Row {i + 1}
								<RawDataModal
									color="red"
									data={currentImportDetail.errorInfo}
									dev={true}
									buttonText="Error Details"
									title="Row {i + 1} Error Details"
								/>
							</Card>
						{/if}
					{/each}
				</div>
			{/if}
		{/if}
	{/await}
</PageLayout>
