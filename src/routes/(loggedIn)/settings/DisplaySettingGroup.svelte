<script lang="ts">
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	type DisplaySettingItem = {
		title: string;
		textValue?: string;
		options?: { title: string; selected: boolean }[];
	};

	const {
		data,
		rawData
	}: { data: DisplaySettingItem[]; rawData: Record<string, any> | undefined } = $props();
</script>

<div class="flex flex-row gap-2">
	{#if rawData}
		<div class="flex basis-0">
			<RawDataModal data={rawData} dev outline />
		</div>
	{/if}

	<div class="flex grow flex-col gap-2">
		{#each data as item}
			<div class="flex flex-row items-center gap-4">
				<div class="flex grow basis-0 justify-end font-bold">{item.title}</div>
				<div class="flex grow basis-0">
					{#if item.textValue}{item.textValue}{/if}
					{#if item.options}
						<div class="flex flex-row">
							{#each item.options as option}
								<div
									class="border-primary-500 flex border-t border-b border-l px-2 py-1 first:rounded-l-md last:rounded-r-md last:border-r"
									class:bg-primary-200={option.selected}
									class:text-primary-300={!option.selected}
								>
									{option.title}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
