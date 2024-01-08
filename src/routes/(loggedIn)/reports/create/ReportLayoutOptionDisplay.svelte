<script lang="ts">
	export let format: 'default' | 'sixEven';

	const configurations = {
		default: [
			{ cols: 5, rows: 3 },
			{ cols: 1, rows: 1 },
			{ cols: 1, rows: 1 },
			{ cols: 1, rows: 1 },
			{ cols: 6, rows: 4 }
		],
		sixEven: [
			{ cols: 3, rows: 3 },
			{ cols: 3, rows: 3 },
			{ cols: 3, rows: 3 },
			{ cols: 3, rows: 3 },
			{ cols: 3, rows: 3 },
			{ cols: 3, rows: 3 }
		]
	};

	$: currentConfiguration = configurations[format] || configurations.default;
</script>

<div class="grid grid-cols-6 gap-2 auto-rows-[50px]">
	{#each currentConfiguration as { cols, rows }}
		<div
			class="col-span-2 h-full w-full rounded-lg shadow-md border border-gray-300 hover:border-gray-500 hover:shadow-lg"
			class:col-span-1={cols === 1}
			class:col-span-2={cols === 2}
			class:col-span-3={cols === 3}
			class:col-span-4={cols === 4}
			class:col-span-5={cols === 5}
			class:col-span-6={cols === 6}
			class:row-span-1={rows === 1}
			class:row-span-2={rows === 2}
			class:row-span-3={rows === 3}
			class:row-span-4={rows === 4}
			class:row-span-5={rows === 5}
			class:row-span-6={rows === 6}
		></div>
	{/each}
</div>
