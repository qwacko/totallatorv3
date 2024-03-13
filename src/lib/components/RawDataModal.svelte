<script lang="ts">
	import { Button, Modal, type ButtonColorType } from 'flowbite-svelte';
	import CodeIcon from '~icons/mdi/xml';

	export let data: unknown;
	export let title = 'Raw Data';
	export let dev = false;
	export let buttonText: string | undefined = undefined;
	export let color: ButtonColorType | undefined = undefined;
	export let outline = false;

	let open = false;
</script>

{#if dev}
	<Button
		{color}
		{outline}
		on:click={() => (open = true)}
		class="flex flex-row content-center gap-2 p-2"
	>
		<CodeIcon />
		{#if buttonText}
			{buttonText}
		{/if}
	</Button>
	<Modal {title} bind:open autoclose outsideclose>
		<pre>{JSON.stringify(data, null, 2)}</pre>
	</Modal>
{/if}
