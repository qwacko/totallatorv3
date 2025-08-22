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
		onclick={() => setNew(true)}
		class="flex grow basis-0"
		{disabled}
	>
		{onTitle}
	</Button>
	<Button
		outline={value !== false}
		color="primary"
		onclick={() => setNew(false)}
		class="flex grow basis-0"
		{disabled}
	>
		{offTitle}
	</Button>
	{#if !hideClear}
		<Button
			outline={value !== undefined}
			color="primary"
			onclick={() => setNew(undefined)}
			class="flex grow basis-0"
			{disabled}
		>
			{clearTitle}
		</Button>
	{/if}
</ButtonGroup>
