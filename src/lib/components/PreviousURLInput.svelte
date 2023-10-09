<script lang="ts">
	import { pageStore } from '$lib/prevPageStore';
	export let name = 'previousURL';
</script>

<input type="hidden" {name} value={$pageStore.prevURL} />
