<script lang="ts">
	import { createCombobox, melt } from '@melt-ui/svelte';
	import ChevronDown from '~icons/mdi/chevron-down';
	import ChevronUp from '~icons/mdi/chevron-up';
	import Check from '~icons/mdi/check';
	import { fly } from 'svelte/transition';
	import HighlightText from './HighlightText.svelte';
	import { Label } from 'flowbite-svelte';

	type T = $$Generic<{ id: string }>;
	type OptionFunction = (data: T) => { value: string; label: string; disabled?: boolean };
	type DisplayFunction = (data: T) => { group?: string; title: string };

	export let items: T[];
	export let filterItems: (data: T[], target: string) => T[] = (items, search) => {
		return items.filter((item) => {
			const display = itemToDisplay(item);
			const titleFound = display.title.toLowerCase().includes(search);
			const groupFound = display.group ? display.group.toLowerCase().includes(search) : false;

			return titleFound || groupFound;
		});
	};
	export let placeholder = 'Select Item...';
	export let title: string | undefined;
	export let itemToOption: OptionFunction;
	export let itemToDisplay: DisplayFunction;
	export let highlightSearch = true;

	const {
		elements: { menu, input, option, label },
		states: { open, inputValue, touchedInput },
		helpers: { isSelected, isHighlighted }
	} = createCombobox({
		forceVisible: true
	});

	$: filteredItems = $touchedInput ? filterItems(items, $inputValue.toLowerCase()) : items;
	$: console.log('Input : ', input);
</script>

<div class="flex flex-col gap-2">
	{#if title}
		<Label {...$label}>{title}</Label>
	{/if}

	<div class="relative">
		<input
			{...$input}
			use:input
			class="block w-full disabled:cursor-not-allowed disabled:opacity-50 p-2.5 focus:border-primary-500
            focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500
            bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
            border-gray-300 dark:border-gray-600 text-sm rounded-lg border"
			{placeholder}
		/>
		<div class="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-magnum-900">
			{#if $open}
				<ChevronUp class="square-4" />
			{:else}
				<ChevronDown class="square-4" />
			{/if}
		</div>
	</div>
</div>
{#if $open}
	<ul
		class="z-10 flex max-h-[300px] flex-col overflow-hidden rounded-md border bg-gray-50 dark:bg-gray-700"
		{...$menu}
		use:menu
		transition:fly={{ duration: 150, y: -5 }}
	>
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div class="flex max-h-full flex-col gap-0 overflow-y-auto px-2 py-2 text-black" tabindex="0">
			{#each filteredItems as currentItem, index (index)}
				{@const currentItemDisplay = itemToDisplay(currentItem)}
				<li
					{...$option(itemToOption(currentItem))}
					use:option
					class="relative cursor-pointer scroll-my-2 rounded-md py-2 pl-4 pr-4
        data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900
          data-[disabled]:opacity-50"
				>
					{#if $isSelected(itemToOption(currentItem))}
						<div class="check absolute left-2 top-1/2 z-10 text-magnum-900">
							<Check class="square-4" />
						</div>
					{/if}
					<div class="pl-4">
						<span class="font-medium">
							<HighlightText
								text={currentItemDisplay.title}
								searchText={$inputValue}
								highlight={highlightSearch}
							/>
						</span>
						{#if currentItemDisplay.group}
							<span class="block text-sm opacity-75">
								<HighlightText
									text={currentItemDisplay.group}
									searchText={$inputValue}
									highlight={highlightSearch}
								/>
							</span>
						{/if}
					</div>
				</li>
			{:else}
				<li
					class="relative cursor-pointer rounded-md py-1 pl-8 pr-4
        data-[highlighted]:bg-magnum-100 data-[highlighted]:text-magnum-700"
				>
					No results found
				</li>
			{/each}
		</div>
	</ul>
{/if}

<style>
	.check {
		translate: 0 calc(-50% + 1px);
	}
</style>
