<script lang="ts">
	import { Button } from 'flowbite-svelte';
</script>

<Button on:click={() => window.history.back()} {...$$restProps}>
	<slot>Cancel</slot>
</Button>
