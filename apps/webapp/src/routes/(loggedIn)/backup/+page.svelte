<script lang="ts">
	import {
		Badge,
		Button,
		ButtonGroup,
		Input,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	import ActionButton from '$lib/components/ActionButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import TablePagination from '$lib/components/TablePagination.svelte';
	import { customEnhance, defaultCustomEnhance } from '$lib/helpers/customEnhance';
	import { pageInfo, urlGenerator } from '$lib/routes.js';

	const { data } = $props();

	const urlInfo = pageInfo('/(loggedIn)/backup', () => page);

	let backupName = $state<string | undefined>(undefined);

	const displayFiles = $derived(data.backupFiles);

	let creatingBackup = $state(false);
	let refreshing = $state(false);
	let tidyingBackups = $state(false);
</script>

<CustomHeader pageTitle="Backups" numPages={data.numPages} pageNumber={data.page} />

<PageLayout title="Backups" size="xl">
	{#snippet slotRight()}
		<Button href={urlGenerator({ address: '/(loggedIn)/backup/import' }).url} outline color="green">
			Import
		</Button>
		<form
			use:enhance={customEnhance({
				updateLoading: (loading) => (refreshing = loading)
			})}
			method="post"
			action="?/refresh"
		>
			<ActionButton
				loading={refreshing}
				message="Refresh"
				loadingMessage="Refreshing..."
				type="submit"
				outline
			/>
		</form>
		<form
			use:enhance={customEnhance({
				updateLoading: (loading) => (tidyingBackups = loading)
			})}
			method="post"
			action="?/tidyBackups"
		>
			<ActionButton
				loading={tidyingBackups}
				message="Cleanse"
				loadingMessage="Cleansing..."
				type="submit"
				outline
			/>
		</form>
	{/snippet}
	{#if data.numberOfBackups > 0}
		<div class="flex flex-row justify-center">
			<TablePagination
				count={data.numberOfBackups}
				page={data.page}
				perPage={data.perPage}
				buttonCount={5}
				urlForPage={(newPage) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: newPage } }).url}
			/>
		</div>
		<Table>
			<TableHead>
				<TableHeadCell>Actions</TableHeadCell>
				<TableHeadCell>Creation Date</TableHeadCell>
				<TableHeadCell>Locked</TableHeadCell>
				<TableHeadCell>Backup Name</TableHeadCell>
				<TableHeadCell>Version</TableHeadCell>
				<TableHeadCell>Created By</TableHeadCell>
				<TableHeadCell>Created Reason</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>File Exists</TableHeadCell>
				<TableHeadCell>Restored Date</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each displayFiles as backup}
					<TableBodyRow>
						<TableBodyCell>
							<div class="flex flex-row gap-2">
								<ButtonGroup>
									<Button
										href={urlGenerator({
											address: '/(loggedIn)/backup/[id]',
											paramsValue: { id: backup.id }
										}).url}
										outline
										color="blue"
									>
										View
									</Button>
									<RawDataModal data={backup} dev={data.dev} outline />
								</ButtonGroup>
							</div>
						</TableBodyCell>
						<TableBodyCell>
							{new Date(backup.createdAt).toISOString().substring(0, 10)}
						</TableBodyCell>
						<TableBodyCell>
							{#if backup.locked}<Badge color="red">Locked</Badge>{/if}
						</TableBodyCell>
						<TableBodyCell>{backup.title}</TableBodyCell>
						<TableBodyCell>{backup.version}</TableBodyCell>
						<TableBodyCell>{backup.createdBy}</TableBodyCell>
						<TableBodyCell>{backup.creationReason}</TableBodyCell>
						<TableBodyCell>
							{#if backup.compressed}<Badge color="blue">Compressed JSON</Badge>{:else}<Badge
									color="green"
								>
									JSON
								</Badge>{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if backup.fileExists}<Badge>Exists</Badge>{:else}<Badge color="red">
									Missing
								</Badge>{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if backup.restoreDate}{new Date(backup.restoreDate)
									.toISOString()
									.substring(0, 10)}{/if}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{:else}
		<Badge color="blue" class="p-4">No Backups Present</Badge>
	{/if}
	<div class="flex flex-row gap-2">
		<form
			action="?/backup"
			method="post"
			class="flex grow flex-row gap-2"
			use:enhance={defaultCustomEnhance({
				updateLoading: (loading) => (creatingBackup = loading),
				defaultSuccessMessage: 'Successfully Created Backup'
			})}
		>
			<Input
				bind:value={backupName}
				name="backupName"
				placeholder="Backup Name"
				class="flex grow"
				disabled={creatingBackup}
			/>
			<ActionButton
				type="submit"
				class="whitespace-nowrap"
				loading={creatingBackup}
				loadingMessage="Creating..."
				message="Create Backup"
			/>
		</form>
		<form
			action="?/backupUncompressed"
			class="flex flex-row gap-2"
			method="post"
			use:enhance={defaultCustomEnhance({
				updateLoading: (loading) => (creatingBackup = loading),
				defaultSuccessMessage: 'Successfully Created Backup'
			})}
		>
			<input type="hidden" name="backupName" value={backupName} />
			<ActionButton
				type="submit"
				class="whitespace-nowrap"
				loading={creatingBackup}
				message="Create Uncompressed Backup"
				loadingMessage="Creating..."
			/>
		</form>
	</div>
</PageLayout>
