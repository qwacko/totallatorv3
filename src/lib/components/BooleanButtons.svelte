<script lang="ts">
	import { Button, ButtonGroup } from 'flowbite-svelte';

	export let value: boolean | undefined;
	export let setNew: (newValue: boolean | undefined) => void;

	export let onTitle: string = 'True';
	export let offTitle: string = 'False';
	export let clearTitle: string = 'Clear';
	export let hideClear: boolean = false;
	export let disabled: boolean = false;
</script>

<ButtonGroup>
	<Button
		outline={value !== true}
		color="primary"
		on:click={() => setNew(true)}
		class="flex flex-grow basis-0"
		{disabled}
	>
		{onTitle}
	</Button>
	<Button
		outline={value !== false}
		color="primary"
		on:click={() => setNew(false)}
		class="flex flex-grow basis-0"
		{disabled}
	>
		{offTitle}
	</Button>
	{#if !hideClear}
		<Button
			outline={value !== undefined}
			color="primary"
			on:click={() => setNew(undefined)}
			class="flex flex-grow basis-0"
			{disabled}
		>
			{clearTitle}
		</Button>
	{/if}
</ButtonGroup>
