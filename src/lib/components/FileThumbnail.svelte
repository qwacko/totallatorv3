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
			type: FileTypeType

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
		class:max-h-64={size === 'lg'}
		class:max-w-64={size === 'lg'}
		class:max-h-48={size === 'md'}
		class:max-w-48={size === 'md'}
	>
		<img
			src={urlGenerator({
				address: '/(loggedIn)/files/[id]/image/[filename]',
				paramsValue: { id: item.id, filename: item.thumbnailFilename }
			}).url}
			alt={item.originalFilename}
			class="w-full h-full"
		/>
	</button>
	<Modal size="xl" bind:open={showPopover} outsideclose title={item.originalFilename}>
		<img 
			src={urlGenerator({
				address: '/(loggedIn)/files/[id]/image/[filename]',
				paramsValue: { id: item.id, filename: item.thumbnailFilename }
			}).url}
			alt={item.originalFilename}
			class="w-full h-full"
		/>
	</Modal>
{:else if showPlaceholder}
	<div
		class="flex flex-col gap-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 overflow-hidden p-4"
		class:h-32={size === 'sm'}
		class:w-32={size === 'sm'}
		class:h-64={size === 'lg'}
		class:w-64={size === 'lg'}
		class:h-48={size === 'md'}
		class:w-48={size === 'md'}
	>
		{#if item.type === "pdf"}
			<Badge>PDF</Badge>
		{:else if item.type === "avif"}
			<Badge>AVIF</Badge>
		{:else if item.type === "webp"}
			<Badge>WEBP</Badge>
		{:else if item.type === "svg"}
			<Badge>SVG</Badge>
		{:else if item.type === "gif"}
			<Badge>GIF</Badge>
		{:else if item.type === "jpg"}
			<Badge>JPG</Badge>
		{:else if item.type === "png"}
			<Badge>PNG</Badge>
		{:else if item.type === "tiff"}
			<Badge>TIFF</Badge>
		{:else}
			<Badge>File</Badge>
		{/if}
		
		<p class="text-gray-500 text-wrap text-xs">{item.originalFilename}</p>
	</div>
{/if}

