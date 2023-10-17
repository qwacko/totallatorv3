<script lang="ts">
	import { enhance } from '$app/forms';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TablePagination from '$lib/components/TablePagination.svelte';
	import { pageInfo } from '$lib/routes.js';
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
								<form action="?/restore" method="post" use:enhance class="flex">
									<input type="hidden" name="backupName" value={backup} />
									<Button type="submit" outline color="green">Restore</Button>
								</form>
								<form action="?/delete" method="post" use:enhance class="flex">
									<input type="hidden" name="backupName" value={backup} />
									<Button class="delete-button" type="submit" outline color="red">Delete</Button>
								</form>
							</div>
						</TableBodyCell>
						<TableBodyCell>{backup}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{:else}
		<Badge color="blue" class="p-4">No Backups Present</Badge>
	{/if}
	<form action="?/backup" method="post" use:enhance>
		<div class="flex flex-row gap-2">
			<Input name="backupName" placeholder="Backup Name" class="flex flex-grow" />
			<Button type="submit" class="whitespace-nowrap">Create New Backup</Button>
		</div>
	</form>
</PageLayout>
