<script lang="ts">
	import type { popoverViewSetting } from '$lib/stores/popoverView';
	import { Button, ButtonGroup } from 'flowbite-svelte';

	let { config = $bindable() }: { config: popoverViewSetting } = $props();
</script>

<div class="flex flex-row gap-2">
	<ButtonGroup>
		<Button
			color="primary"
			outline={config.includeTransfers === true}
			on:click={() => (config.includeTransfers = false)}
		>
			Include Transfers
		</Button>
		<Button
			color="primary"
			outline={config.includeTransfers === false}
			on:click={() => (config.includeTransfers = true)}
		>
			Exclude Transfers
		</Button>
	</ButtonGroup>

	<ButtonGroup>
		<Button
			color="primary"
			outline={config.dateRange !== 'all'}
			on:click={() => (config.dateRange = 'all')}
		>
			All Data
		</Button>
		<Button
			color="primary"
			outline={config.dateRange !== 'last12'}
			on:click={() => (config.dateRange = 'last12')}
		>
			Last 12 Months
		</Button>
		<Button
			color="primary"
			outline={config.dateRange !== 'toNow'}
			on:click={() => (config.dateRange = 'toNow')}
		>
			To Now
		</Button>
	</ButtonGroup>
</div>
