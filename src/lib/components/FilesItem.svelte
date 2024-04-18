<script lang="ts">
	import { Button, Timeline, TimelineItem, Badge, P, Spinner } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import FileIcon from './icons/FileIcon.svelte';
	import type { GroupedFilesType } from '$lib/server/db/actions/fileActions';
	import { urlGenerator } from '$lib/routes';
	import DownloadIcon from './icons/DownloadIcon.svelte';
	import UnlinkIcon from './icons/UnlinkIcon.svelte';
	import { fileRelationshipKeys } from '$lib/schema/helpers/fileNoteRelationship';
	import FileThumbnail from './FileThumbnail.svelte';

	export let currentFile: GroupedFilesType[number];

	let deleting = false;
	let updating = false;
</script>

<Timeline order="activity">
	<TimelineItem classLi="mb-0">
		<svelte:fragment slot="icon">
			<span
				class="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-200 ring-8 ring-white dark:bg-primary-900 dark:ring-gray-900"
			>
				<FileIcon />
			</span>
		</svelte:fragment>
		<div class="flex flex-col gap-2">
			<div class="flex flex-row items-center gap-2">
				<Badge>
					{currentFile.type}
				</Badge>
				<P weight="light" size="sm">{currentFile.createdBy || ''}</P>
				<P weight="light" size="sm">
					{new Date(currentFile.createdAt).toISOString().slice(0, 10)}
				</P>
				<form
					method="post"
					action="?/deleteFile"
					use:enhance={customEnhance({ updateLoading: (newLoading) => (deleting = newLoading) })}
				>
					<input type="hidden" name="fileId" value={currentFile.id} />
					<Button
						type="submit"
						outline
						color="red"
						class="rounded-lg border p-2"
						disabled={deleting}
					>
						{#if deleting}<div class="flex flex-row items-center gap-1">
								<Spinner class="h-3 w-3" /> Deleting...
							</div>{:else}<DeleteIcon />{/if}
					</Button>
				</form>
				<form
					method="post"
					action="?/updateFile"
					use:enhance={customEnhance({ updateLoading: (newLoading) => (updating = newLoading) })}
				>
					{#each fileRelationshipKeys as key}
						<input type="hidden" name={key} value={null} />
					{/each}
					<input type="hidden" name="id" value={currentFile.id} />

					<Button
						type="submit"
						outline
						color="blue"
						class="rounded-lg border p-2"
						disabled={updating}
					>
						{#if updating}<div class="flex flex-row items-center gap-1">
								<Spinner class="h-3 w-3" />
							</div>{:else}<UnlinkIcon />{/if}
					</Button>
				</form>

				<Button
					href={urlGenerator({
						address: '/(loggedIn)/files/[id]/[filename]',
						paramsValue: { id: currentFile.id, filename: currentFile.originalFilename }
					}).url}
					color="blue"
					class="rounded-lg border p-2"
					outline
				>
					<DownloadIcon />
				</Button>
			</div>
			<div class="whitespace-pre">{currentFile.originalFilename}</div>
			<FileThumbnail item={currentFile} />
		</div>
	</TimelineItem>
</Timeline>
