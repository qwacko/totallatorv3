<script lang="ts">
	import { urlGenerator } from '$lib/routes';

	export let item: {
		thumbnailFilename?: string | undefined | null;
		id: string;
		originalFilename: string;
	};
</script>

{#if item.thumbnailFilename}
	<img
		src={urlGenerator({
			address: '/(loggedIn)/files/[id]/image/[filename]',
			paramsValue: { id: item.id, filename: item.thumbnailFilename }
		}).url}
		alt={item.originalFilename}
		class="max-h-48 max-w-48 object-contain"
	/>
{/if}
