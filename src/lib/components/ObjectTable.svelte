<script lang="ts">
	import {
		Alert,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import HighlightText from './HighlightText.svelte';

	export let data: Record<string, { text?: string; error?: string } | string | undefined>;
	export let highlightText: string | undefined = undefined;
	export let hideUndefined: boolean = false;
</script>

<Table>
	<TableHead>
		<TableHeadCell>Key</TableHeadCell>
		<TableHeadCell>Data</TableHeadCell>
	</TableHead>
	<TableBody>
		{#each Object.entries(data) as [key, value]}
			{#if !hideUndefined || value !== undefined}
				<TableBodyRow>
					<TableBodyCell>{key}</TableBodyCell>
					<TableBodyCell>
						{#if value !== undefined}
							{#if typeof value === 'string'}
								<HighlightText
									highlight={highlightText !== undefined}
									searchText={highlightText}
									text={value}
								/>
							{:else if 'error' in value}
								<Alert color="red">
									<span class="font-medium">Error</span>
									<span class="font-thin">{value.error}</span>
								</Alert>
							{:else if 'text' in value}
								<HighlightText
									highlight={highlightText !== undefined}
									searchText={highlightText}
									text={value.text}
								/>
							{/if}
						{/if}
					</TableBodyCell>
				</TableBodyRow>
			{/if}
		{/each}
	</TableBody>
</Table>
