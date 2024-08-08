<script lang="ts">
	import { Modal, Button } from 'flowbite-svelte';
	import { format } from 'sql-formatter';

	const {data} : {data: { query?: string | null; params?: string | null }} = $props();

	let modalOpened = $state(false);

	const formattedQuery = $derived(data.query ? format(data.query, { language: 'postgresql' }) : '');
</script>

<Button size="xs" on:click={() => (modalOpened = true)}>+</Button>
<Modal title="Query Detail" bind:open={modalOpened} outsideclose>
	<pre>{data.params}</pre>
	<pre>{formattedQuery}</pre>
</Modal>
