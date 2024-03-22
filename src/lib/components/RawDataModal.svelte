<script lang="ts">
	import { Button, Modal, type ButtonColorType } from 'flowbite-svelte';
	import CodeIcon from '~icons/mdi/xml';
	import MoreIcon from './icons/MoreIcon.svelte';

	export let data: unknown;
	export let title = 'Raw Data';
	export let dev = false;
	export let buttonText: string | undefined = undefined;
	export let color: ButtonColorType | undefined = undefined;
	export let outline = false;
	export let icon: 'more' | 'code' = 'code';

	let open = false;
</script>

{#if dev}
	<Button
		{color}
		{outline}
		on:click={() => (open = true)}
		class="flex flex-row content-center gap-2 p-2"
	>
		{#if icon === 'code'}
			<CodeIcon />
		{:else if icon === 'more'}
			<MoreIcon />
		{/if}
		{#if buttonText}
			{buttonText}
		{/if}
	</Button>
	<Modal {title} bind:open autoclose outsideclose>
		<pre>{JSON.stringify(data, null, 2)}</pre>
	</Modal>
{/if}
