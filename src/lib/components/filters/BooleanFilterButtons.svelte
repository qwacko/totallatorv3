<script lang="ts">
	import { ButtonGroup, Button } from 'flowbite-svelte';

	export let value: boolean | undefined;
	export let onTitle: string = 'True';
	export let offTitle: string = 'False';
	export let clearTitle: string = 'Clear';
	export let title: string | undefined = undefined;
	export let name: string | undefined = undefined;
	export let hideClear: boolean = false;
</script>

<div class="flex flex-col gap-2">
	{#if name}
		<input type="hidden" {name} bind:value />
	{/if}
	{#if title}
		<div class="flex text-primary-900 font-semibold text-sm">
			{title}
		</div>
	{/if}
	<ButtonGroup>
		<Button
			outline={value !== true}
			color="primary"
			on:click={() => (value = true)}
			class="flex flex-grow basis-0"
		>
			{onTitle}
		</Button>
		<Button
			outline={value !== false}
			color="primary"
			on:click={() => (value = false)}
			class="flex flex-grow basis-0"
		>
			{offTitle}
		</Button>
		{#if !hideClear}
			<Button
				outline={value !== undefined}
				color="primary"
				on:click={() => (value = undefined)}
				class="flex flex-grow basis-0"
			>
				{clearTitle}
			</Button>
		{/if}
	</ButtonGroup>
</div>
