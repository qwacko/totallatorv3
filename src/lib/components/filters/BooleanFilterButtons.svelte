<script lang="ts">
	import { ButtonGroup, Button } from 'flowbite-svelte';

	export let value: boolean | undefined;
</script>

<ButtonGroup>
	<Button
		outline={value !== true}
		color="primary"
		on:click={() => (value = true)}
		class="flex flex-grow basis-0"
	>
		Complete
	</Button>
	<Button
		outline={value !== false}
		color="primary"
		on:click={() => (value = false)}
		class="flex flex-grow basis-0"
	>
		Incomplete
	</Button>
	<Button
		outline={value !== undefined}
		color="primary"
		on:click={() => (value = undefined)}
		class="flex flex-grow basis-0"
	>
		Any
	</Button>
</ButtonGroup>
