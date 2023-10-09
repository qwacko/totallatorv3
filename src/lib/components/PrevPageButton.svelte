<script lang="ts">
	import { pageStore } from '$lib/prevPageStore';
	import { Button } from 'flowbite-svelte';
</script>

<Button href={$pageStore.prevURL} {...$$restProps}>
	<slot>Cancel</slot>
</Button>
