<script lang="ts">
	import { urlGenerator } from '$lib/routes';
	import type { FileTypeType } from '$lib/schema/enum/fileTypeEnum';
	import { Badge, Modal } from 'flowbite-svelte';

	const {
		item,
		size = 'md',
		showPlaceholder = true
	}: {
		item: {
			thumbnailFilename?: string | undefined | null;
			id: string;
			originalFilename: string;
			filename: string;
			type: FileTypeType;
		};
		size?: 'sm' | 'md' | 'lg';
		showPlaceholder?: boolean;
	} = $props();

	let showPopover = $state(false);
</script>

{#if item.thumbnailFilename}
	<button
		type="button"
		onclick={() => {
			showPopover = true;
		}}
		class=" object-contain"
		class:max-h-32={size === 'sm'}
		class:max-w-32={size === 'sm'}
		class:max-h-96={size === 'lg'}
		class:max-w-96={size === 'lg'}
		class:max-h-48={size === 'md'}
		class:max-w-48={size === 'md'}
	>
		<img
			src={urlGenerator({
				address: '/(loggedIn)/files/[id]/image/[filename]',
				paramsValue: { id: item.id, filename: item.thumbnailFilename }
			}).url}
			alt={item.originalFilename}
			class="h-full w-full"
		/>
	</button>
	<Modal size="xl" bind:open={showPopover} outsideclose title={item.originalFilename}>
		<div class="flex h-full w-full items-center justify-center">
			<img
				src={urlGenerator({
					address: '/(loggedIn)/files/[id]/[filename]',
					paramsValue: { id: item.id, filename: item.originalFilename }
				}).url}
				alt={item.originalFilename}
				class="max-h-full max-w-full"
			/>
		</div>
	</Modal>
{:else if showPlaceholder}
	<div
		class="flex flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 p-4"
		class:h-32={size === 'sm'}
		class:w-32={size === 'sm'}
		class:h-96={size === 'lg'}
		class:w-96={size === 'lg'}
		class:h-48={size === 'md'}
		class:w-48={size === 'md'}
	>
		{#if item.type === 'pdf'}
			<Badge>PDF</Badge>
		{:else if item.type === 'avif'}
			<Badge>AVIF</Badge>
		{:else if item.type === 'webp'}
			<Badge>WEBP</Badge>
		{:else if item.type === 'svg'}
			<Badge>SVG</Badge>
		{:else if item.type === 'gif'}
			<Badge>GIF</Badge>
		{:else if item.type === 'jpg'}
			<Badge>JPG</Badge>
		{:else if item.type === 'png'}
			<Badge>PNG</Badge>
		{:else if item.type === 'tiff'}
			<Badge>TIFF</Badge>
		{:else}
			<Badge>File</Badge>
		{/if}

		<p class="text-xs text-wrap text-gray-500">{item.originalFilename}</p>
	</div>
{/if}
