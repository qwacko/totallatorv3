<script lang="ts">
	import { enhance } from '$app/forms';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TablePagination from '$lib/components/TablePagination.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import {
		Badge,
		Button,
		Input,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import CustomHeader from '$lib/components/CustomHeader.svelte';

	$: urlInfo = pageInfo('/(loggedIn)/backup', $page);

	export let data;

	let backupName: undefined | string = undefined;

	$: displayFiles = data.backupFiles;
</script>

<CustomHeader pageTitle="Backups" numPages={data.numPages} pageNumber={data.page} />

<PageLayout title="Backups">
	{#if data.numberOfBackups > 0}
		<div class="flex flex-row justify-center">
			<TablePagination
				count={data.numberOfBackups}
				page={data.page}
				perPage={data.perPage}
				buttonCount={5}
				urlForPage={(newPage) => urlInfo.updateParams({ searchParams: { page: newPage } }).url}
			/>
		</div>
		<Table>
			<TableHead>
				<TableHeadCell>Actions</TableHeadCell>
				<TableHeadCell>Backup Name</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each displayFiles as backup}
					<TableBodyRow>
						<TableBodyCell>
							<div class="flex flex-row gap-2">
								<Button
									href={urlGenerator({
										address: '/(loggedIn)/backup/[filename]',
										paramsValue: { filename: backup.filename }
									}).url}
									outline
									color="blue"
								>
									View
								</Button>
							</div>
						</TableBodyCell>
						<TableBodyCell>{backup.filename}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{:else}
		<Badge color="blue" class="p-4">No Backups Present</Badge>
	{/if}
	<div class="flex flex-row gap-2">
		<form action="?/backup" method="post" class="flex flex flex-row gap-2 flex-grow" use:enhance>
			<Input
				bind:value={backupName}
				name="backupName"
				placeholder="Backup Name"
				class="flex flex-grow"
			/>
			<Button type="submit" class="whitespace-nowrap">Create New Backup</Button>
		</form>
		<form action="?/backupUncompressed" class="flex flex flex-row gap-2" method="post" use:enhance>
			<input type="hidden" name="backupName" value={backupName} />
			<Button type="submit" class="whitespace-nowrap">Create New Uncompressed Backup</Button>
		</form>
	</div>
</PageLayout>
