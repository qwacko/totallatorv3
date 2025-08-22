<script lang="ts">
	import { Button, ButtonGroup } from 'flowbite-svelte';

	import type { popoverViewSetting } from '$lib/stores/popoverView';

	let { config = $bindable() }: { config: popoverViewSetting } = $props();
</script>

<div class="flex flex-row gap-2">
	<ButtonGroup>
		<Button
			color="primary"
			outline={config.includeTransfers === true}
			onclick={() => (config.includeTransfers = false)}
		>
			Include Transfers
		</Button>
		<Button
			color="primary"
			outline={config.includeTransfers === false}
			onclick={() => (config.includeTransfers = true)}
		>
			Exclude Transfers
		</Button>
	</ButtonGroup>

	<ButtonGroup>
		<Button
			color="primary"
			outline={config.dateRange !== 'all'}
			onclick={() => (config.dateRange = 'all')}
		>
			All Data
		</Button>
		<Button
			color="primary"
			outline={config.dateRange !== 'last12'}
			onclick={() => (config.dateRange = 'last12')}
		>
			Last 12 Months
		</Button>
		<Button
			color="primary"
			outline={config.dateRange !== 'toNow'}
			onclick={() => (config.dateRange = 'toNow')}
		>
			To Now
		</Button>
	</ButtonGroup>
</div>
