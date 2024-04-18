<script lang="ts">
	import { urlGenerator } from '$lib/routes';

	export let item: {
		thumbnailFilename?: string | undefined | null;
		id: string;
		originalFilename: string;
	};

	export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

{#if item.thumbnailFilename}
	<img
		src={urlGenerator({
			address: '/(loggedIn)/files/[id]/image/[filename]',
			paramsValue: { id: item.id, filename: item.thumbnailFilename }
		}).url}
		alt={item.originalFilename}
		class=" object-contain"
		class:max-h-32={size === 'sm'}
		class:max-w-32={size === 'sm'}
		class:max-h-64={size === 'lg'}
		class:max-w-64={size === 'lg'}
		class:max-h-48={size === 'md'}
		class:max-w-48={size === 'md'}
	/>
{/if}
