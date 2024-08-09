<script lang="ts">
	import { Button, ButtonGroup } from 'flowbite-svelte';

	const {
		value,
		setNew,
		onTitle = 'True',
		offTitle = 'False',
		clearTitle = 'Clear',
		hideClear = false,
		disabled = false
	}: {
		value: boolean | undefined;
		setNew: (newValue: boolean | undefined) => void;
		onTitle?: string;
		offTitle?: string;
		clearTitle?: string;
		hideClear?: boolean;
		disabled?: boolean;
	} = $props();
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
