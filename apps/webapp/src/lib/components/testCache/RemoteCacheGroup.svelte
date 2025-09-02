<script lang="ts">
	import RemoteCacheTest from './RemoteCacheTest.svelte';

	let numberItems = $state<number>(1);

	const blankArray = $derived(new Array(numberItems));
</script>

<div class="flex flex-col gap-2 border p-2">
	<div class="flex items-center gap-2">
		<label for="numberItems">Number of items:</label>
		<button
			type="button"
			class="rounded border px-2 py-1"
			onclick={() => (numberItems = Math.max(0, numberItems - 1))}
			aria-label="Decrease"
		>
			-
		</button>
		<input
			id="numberItems"
			type="number"
			min="0"
			max="10"
			bind:value={numberItems}
			class="w-16 rounded border p-1"
		/>
		<button
			type="button"
			class="rounded border px-2 py-1"
			onclick={() => (numberItems = Math.min(10, numberItems + 1))}
			aria-label="Increase"
		>
			+
		</button>
	</div>
	<div class="flex flex-col gap-2">
		{#each blankArray as _, index (index)}
			<svelte:boundary>
				<div class="flex">
					<RemoteCacheTest id={index + 1} />
				</div>
				{#snippet pending()}
					<div class="animate-pulse rounded bg-gray-200 p-2">Loading...</div>
				{/snippet}
			</svelte:boundary>
		{/each}
	</div>
</div>
