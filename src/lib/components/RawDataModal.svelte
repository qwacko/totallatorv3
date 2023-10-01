<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';
	import CodeIcon from '~icons/mdi/xml';

	export let data: unknown;
	export let title = 'Raw Data';
	export let dev = false;

	let open = false;
</script>

{#if dev}
	<Button on:click={() => (open = true)} class="content-center p-2"><CodeIcon /></Button>
	<Modal {title} bind:open autoclose outsideclose>
		<pre>{JSON.stringify(data, null, 2)}</pre>
	</Modal>
{/if}
