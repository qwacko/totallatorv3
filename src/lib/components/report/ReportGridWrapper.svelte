<script lang="ts">
	import type { PageSizeIds } from '$lib/schema/pageSizeSchema';

	export let size: PageSizeIds = 'lg';
</script>

<div
	class="grid grid-cols-6 gap-2"
	class:auto-rows-[50px]={size === 'xs'}
	class:auto-rows-[100px]={size === 'sm'}
	class:auto-rows-[150px]={size === 'lg'}
	class:auto-rows-[200px]={size === 'xl'}
>
	<slot />
</div>
